import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import Navbar from '../components/Navbar';
import { Upload, CheckCircle, AlertTriangle, XCircle, ChevronDown, ChevronUp, Info } from 'lucide-react';
import axios from 'axios';

// ── Parse a GSTR-2B JSON file downloaded from gst.gov.in ─────────────────────
// GSTR-2B structure: data.docdata.b2b → array of suppliers
// Each supplier: { ctin (GSTIN), inv: [ { inum, idt, val, itms: [{itamt,camt,samt}] } ] }
function parseGSTR2B(jsonData) {
  const entries = [];
  try {
    const suppliers = jsonData?.data?.docdata?.b2b || [];
    for (const supplier of suppliers) {
      const vendorGstin = supplier.ctin;
      for (const inv of (supplier.inv || [])) {
        const totalITC = (inv.itms || []).reduce((sum, item) => {
          return sum + (item.itamt || 0) + (item.camt || 0) + (item.samt || 0);
        }, 0);
        entries.push({
          vendorGstin,
          invoiceNumber: inv.inum,
          invoiceDate:   inv.idt,
          invoiceValue:  inv.val,
          itcAmount:     totalITC,
        });
      }
    }
  } catch (e) {
    console.error('GSTR-2B parse error:', e);
  }
  return entries;
}

// ── Reconcile GSTR-2B entries against logged ITClaim expenses ─────────────────
function reconcile(gstr2bEntries, myExpenses) {
  const matched   = []; // In both GSTR-2B and my logs
  const missing   = []; // In GSTR-2B but NOT in my logs (ITC I'm leaving on the table)
  const atRisk    = []; // In my logs but NOT in GSTR-2B (vendor didn't file → ITC at risk)

  // Build a Set of GSTINs from GSTR-2B for quick lookup
  const gstr2bGstins = new Set(gstr2bEntries.map(e => e.vendorGstin?.toUpperCase()).filter(Boolean));

  // Build a map of GSTIN → total ITC from GSTR-2B
  const gstr2bByGstin = {};
  for (const entry of gstr2bEntries) {
    const g = entry.vendorGstin?.toUpperCase();
    if (!g) continue;
    gstr2bByGstin[g] = (gstr2bByGstin[g] || 0) + entry.itcAmount;
  }

  // Build a map of GSTIN → { totalITC, expenses[] } from my logged expenses
  const myByGstin = {};
  for (const exp of myExpenses) {
    const g = exp.vendorGstin?.toUpperCase();
    if (!g) continue;
    if (!myByGstin[g]) myByGstin[g] = { totalITC: 0, expenses: [], vendorName: exp.vendorName };
    myByGstin[g].totalITC   += exp.gstPaid || 0;
    myByGstin[g].expenses.push(exp);
  }

  // Find matched & at-risk (from my expenses perspective)
  for (const [gstin, myData] of Object.entries(myByGstin)) {
    if (gstr2bGstins.has(gstin)) {
      matched.push({
        gstin,
        vendorName:    myData.vendorName,
        myITC:         myData.totalITC,
        gstr2bITC:     gstr2bByGstin[gstin] || 0,
        diff:          (gstr2bByGstin[gstin] || 0) - myData.totalITC,
      });
    } else {
      atRisk.push({
        gstin,
        vendorName: myData.vendorName,
        myITC:      myData.totalITC,
      });
    }
  }

  // Find missing (in GSTR-2B but not in my logs)
  for (const [gstin, itcAmount] of Object.entries(gstr2bByGstin)) {
    if (!myByGstin[gstin]) {
      missing.push({ gstin, itcAmount });
    }
  }

  return { matched, missing, atRisk };
}

// ── Summary card ──────────────────────────────────────────────────────────────
function SummaryCard({ label, value, color, icon }) {
  return (
    <div className="card" style={{ padding: '16px 20px', textAlign: 'center' }}>
      <div style={{ fontSize: 24, marginBottom: 4 }}>{icon}</div>
      <div style={{ fontFamily: 'Space Grotesk', fontSize: 22, fontWeight: 700, color: color || 'var(--text-primary)', marginBottom: 4 }}>
        {value}
      </div>
      <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</div>
    </div>
  );
}

// ── Collapsible instructions section ─────────────────────────────────────────
function HowToGet({ open, toggle }) {
  return (
    <div style={{ marginBottom: 20, borderRadius: 8, border: '1px solid var(--border)', overflow: 'hidden' }}>
      <button
        onClick={toggle}
        style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          padding: '12px 16px', background: 'var(--bg-elevated)', border: 'none', cursor: 'pointer',
          color: 'var(--text-secondary)', fontSize: 13, fontWeight: 600 }}
      >
        <span><Info size={14} style={{ display: 'inline', marginRight: 8 }} />How to download your GSTR-2B JSON from gst.gov.in</span>
        {open ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
      </button>
      {open && (
        <div style={{ padding: '14px 16px', background: 'var(--bg-card)', fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.8 }}>
          <ol style={{ paddingLeft: 18, margin: 0 }}>
            <li>Go to <a href="https://www.gst.gov.in" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--accent-green)' }}>gst.gov.in</a> → Login with your credentials</li>
            <li>Click <strong style={{ color: 'var(--text-primary)' }}>Services</strong> → <strong style={{ color: 'var(--text-primary)' }}>Returns</strong> → <strong style={{ color: 'var(--text-primary)' }}>View Returns / Filing Status</strong></li>
            <li>Find <strong style={{ color: 'var(--text-primary)' }}>GSTR-2B</strong> for the filing month you want to reconcile</li>
            <li>Click <strong style={{ color: 'var(--text-primary)' }}>Download JSON</strong></li>
            <li>Upload that <code style={{ background: 'var(--bg-elevated)', padding: '1px 6px', borderRadius: 4 }}>.json</code> file here</li>
          </ol>
        </div>
      )}
    </div>
  );
}

export default function Reconcile() {
  const [gstr2b,       setGstr2b]       = useState(null);  // parsed GSTR-2B entries
  const [myExpenses,   setMyExpenses]   = useState([]);
  const [result,       setResult]       = useState(null);  // { matched, missing, atRisk }
  const [loading,      setLoading]      = useState(false);
  const [error,        setError]        = useState('');
  const [instructions, setInstructions] = useState(false);
  const [fileName,     setFileName]     = useState('');

  // Load user expenses from the API (we need vendorGstin to reconcile)
  const loadExpenses = async () => {
    try {
      const res = await axios.get('/expenses?limit=500');
      return res.data.expenses || [];
    } catch {
      return [];
    }
  };

  const onDrop = useCallback(async (acceptedFiles) => {
    const f = acceptedFiles[0];
    if (!f) return;
    setError('');
    setResult(null);
    setFileName(f.name);
    setLoading(true);

    try {
      const text = await f.text();
      const json = JSON.parse(text);
      const entries = parseGSTR2B(json);

      if (entries.length === 0) {
        setError('No supplier entries found in this GSTR-2B file. Make sure you downloaded the correct JSON from gst.gov.in.');
        setLoading(false);
        return;
      }

      const expenses = await loadExpenses();
      setMyExpenses(expenses);
      setGstr2b(entries);
      setResult(reconcile(entries, expenses));
    } catch (e) {
      console.error(e);
      setError('Could not parse the file. Make sure it is a valid GSTR-2B JSON downloaded from gst.gov.in.');
    } finally {
      setLoading(false);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'application/json': ['.json'] },
    maxFiles: 1,
    maxSize: 20 * 1024 * 1024,
  });

  // Summary totals
  const totalGstr2b  = gstr2b?.reduce((s, e) => s + e.itcAmount, 0) || 0;
  const totalMyITC   = myExpenses.filter(e => e.itcStatus === 'claimable').reduce((s, e) => s + (e.gstPaid || 0), 0);
  const totalMatched = result?.matched.reduce((s, e) => s + e.myITC, 0) || 0;
  const totalMissing = result?.missing.reduce((s, e) => s + e.itcAmount, 0) || 0;
  const totalAtRisk  = result?.atRisk.reduce((s, e) => s + e.myITC, 0) || 0;

  const fmt = (n) => '₹' + Number(n || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 });

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <Navbar />
      <main className="main-content">

        {/* Header */}
        <div style={{ marginBottom: 28 }}>
          <h1 style={{ fontFamily: 'Space Grotesk', fontSize: 24, fontWeight: 700, marginBottom: 4 }}>
            GSTR-2B Reconciliation
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>
            Upload your GSTR-2B JSON from gst.gov.in to cross-check with your logged expenses
          </p>
        </div>

        {/* Instructions */}
        <HowToGet open={instructions} toggle={() => setInstructions(v => !v)} />

        {/* Upload area */}
        <div className="card" style={{ marginBottom: 24 }}>
          <h2 style={{ fontFamily: 'Space Grotesk', fontSize: 16, fontWeight: 600, marginBottom: 16 }}>
            <Upload size={16} style={{ display: 'inline', marginRight: 8 }} />
            Upload GSTR-2B JSON
          </h2>

          <div {...getRootProps()} style={{
            border: `2px dashed ${isDragActive ? 'var(--accent-green)' : 'var(--border)'}`,
            borderRadius: 10, padding: '32px 24px', textAlign: 'center', cursor: 'pointer',
            background: isDragActive ? 'rgba(0,212,170,0.04)' : 'var(--bg-elevated)',
            transition: 'all 0.2s ease',
          }}>
            <input {...getInputProps()} id="gstr2b-upload" />
            {loading ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, color: 'var(--text-secondary)' }}>
                <span className="spinner" style={{ width: 28, height: 28 }} />
                <span style={{ fontSize: 14 }}>Parsing GSTR-2B and fetching your expenses...</span>
              </div>
            ) : fileName && result ? (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, color: 'var(--accent-green)' }}>
                <CheckCircle size={20} />
                <span style={{ fontSize: 14, fontWeight: 600 }}>{fileName} — reconciliation complete</span>
              </div>
            ) : (
              <>
                <div style={{ fontSize: 36, marginBottom: 12 }}>📂</div>
                <p style={{ fontWeight: 600, marginBottom: 6, color: 'var(--text-primary)', fontSize: 15 }}>
                  {isDragActive ? 'Drop your GSTR-2B JSON here!' : 'Drag & drop your GSTR-2B JSON'}
                </p>
                <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 16 }}>Only .json files · Max 20MB</p>
                <button type="button" className="btn-secondary">Browse File</button>
              </>
            )}
          </div>

          {error && (
            <div style={{ marginTop: 14, padding: '10px 14px', borderRadius: 8, background: 'rgba(255,77,77,0.08)', border: '1px solid rgba(255,77,77,0.2)', fontSize: 13, color: 'var(--accent-red)', display: 'flex', gap: 8, alignItems: 'flex-start' }}>
              <XCircle size={15} style={{ flexShrink: 0, marginTop: 1 }} /> {error}
            </div>
          )}
        </div>

        {/* Results */}
        {result && (
          <>
            {/* Summary strip */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 14, marginBottom: 24 }}>
              <SummaryCard label="Total in GSTR-2B"   value={fmt(totalGstr2b)}  color="var(--text-primary)"    icon="📋" />
              <SummaryCard label="Your Logged ITC"     value={fmt(totalMyITC)}   color="var(--text-primary)"    icon="📒" />
              <SummaryCard label="Matched"             value={fmt(totalMatched)} color="var(--accent-green)"    icon="✅" />
              <SummaryCard label="Missing from Logs"   value={fmt(totalMissing)} color="var(--accent-amber, #F5A623)" icon="⚠️" />
              <SummaryCard label="At Risk"             value={fmt(totalAtRisk)}  color="var(--accent-red)"      icon="❌" />
            </div>

            {/* Section 1 — Matched */}
            <div className="card" style={{ marginBottom: 20, padding: 0, overflow: 'hidden' }}>
              <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 10 }}>
                <CheckCircle size={16} style={{ color: 'var(--accent-green)' }} />
                <h3 style={{ fontFamily: 'Space Grotesk', fontSize: 15, fontWeight: 600, margin: 0 }}>
                  Matched ✅ <span style={{ fontWeight: 400, color: 'var(--text-muted)', fontSize: 13 }}>({result.matched.length} vendors)</span>
                </h3>
              </div>
              {result.matched.length === 0 ? (
                <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>
                  No matched vendors — make sure you've entered Vendor GSTINs when logging expenses.
                </div>
              ) : (
                <div style={{ overflowX: 'auto' }}>
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Vendor GSTIN</th>
                        <th>Your Logged ITC</th>
                        <th>GSTR-2B ITC</th>
                        <th>Difference</th>
                      </tr>
                    </thead>
                    <tbody>
                      {result.matched.map((r, i) => (
                        <tr key={i}>
                          <td style={{ fontFamily: 'JetBrains Mono', fontSize: 12 }}>
                            <div style={{ fontWeight: 500, fontSize: 13, color: 'var(--text-primary)' }}>{r.vendorName}</div>
                            <div style={{ color: 'var(--text-muted)' }}>{r.gstin}</div>
                          </td>
                          <td style={{ fontFamily: 'JetBrains Mono', fontSize: 13 }}>{fmt(r.myITC)}</td>
                          <td style={{ fontFamily: 'JetBrains Mono', fontSize: 13 }}>{fmt(r.gstr2bITC)}</td>
                          <td style={{ fontFamily: 'JetBrains Mono', fontSize: 13, color: r.diff >= 0 ? 'var(--accent-green)' : 'var(--accent-red)', fontWeight: 600 }}>
                            {r.diff >= 0 ? '+' : ''}{fmt(r.diff)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Section 2 — Missing from your logs */}
            <div className="card" style={{ marginBottom: 20, padding: 0, overflow: 'hidden' }}>
              <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 10 }}>
                <AlertTriangle size={16} style={{ color: 'var(--accent-amber, #F5A623)' }} />
                <h3 style={{ fontFamily: 'Space Grotesk', fontSize: 15, fontWeight: 600, margin: 0 }}>
                  Missing from your logs ⚠️ <span style={{ fontWeight: 400, color: 'var(--text-muted)', fontSize: 13 }}>({result.missing.length} vendors — ITC you're leaving on the table)</span>
                </h3>
              </div>
              {result.missing.length === 0 ? (
                <div style={{ padding: '24px', textAlign: 'center', color: 'var(--accent-green)', fontSize: 13, fontWeight: 600 }}>
                  🎉 All GSTR-2B entries are logged in ITClaim!
                </div>
              ) : (
                <div style={{ overflowX: 'auto' }}>
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Vendor GSTIN</th>
                        <th>GSTR-2B ITC Amount</th>
                        <th>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {result.missing.map((r, i) => (
                        <tr key={i}>
                          <td style={{ fontFamily: 'JetBrains Mono', fontSize: 12, color: 'var(--text-muted)' }}>{r.gstin}</td>
                          <td style={{ fontFamily: 'JetBrains Mono', fontSize: 13, color: 'var(--accent-amber, #F5A623)', fontWeight: 600 }}>{fmt(r.itcAmount)}</td>
                          <td>
                            <a href="/expenses" style={{ fontSize: 12, color: 'var(--accent-green)', fontWeight: 600, textDecoration: 'none', padding: '4px 10px', border: '1px solid rgba(0,212,170,0.3)', borderRadius: 6 }}>
                              + Add to ITClaim
                            </a>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Section 3 — At Risk */}
            <div className="card" style={{ marginBottom: 20, padding: 0, overflow: 'hidden' }}>
              <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 10 }}>
                <XCircle size={16} style={{ color: 'var(--accent-red)' }} />
                <h3 style={{ fontFamily: 'Space Grotesk', fontSize: 15, fontWeight: 600, margin: 0 }}>
                  At Risk ❌ <span style={{ fontWeight: 400, color: 'var(--text-muted)', fontSize: 13 }}>({result.atRisk.length} vendors — vendor didn't file, ITC may be rejected)</span>
                </h3>
              </div>
              {result.atRisk.length === 0 ? (
                <div style={{ padding: '24px', textAlign: 'center', color: 'var(--accent-green)', fontSize: 13, fontWeight: 600 }}>
                  🎉 All your logged vendors appear in GSTR-2B — no ITC at risk!
                </div>
              ) : (
                <div style={{ overflowX: 'auto' }}>
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Vendor</th>
                        <th>GSTIN</th>
                        <th>Your Logged ITC</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {result.atRisk.map((r, i) => (
                        <tr key={i}>
                          <td style={{ fontWeight: 500, fontSize: 13 }}>{r.vendorName}</td>
                          <td style={{ fontFamily: 'JetBrains Mono', fontSize: 12, color: 'var(--text-muted)' }}>{r.gstin}</td>
                          <td style={{ fontFamily: 'JetBrains Mono', fontSize: 13, color: 'var(--accent-red)', fontWeight: 600 }}>{fmt(r.myITC)}</td>
                          <td style={{ fontSize: 12, color: 'var(--accent-red)' }}>This ITC may be rejected</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Advice note */}
            <div style={{ padding: '14px 18px', borderRadius: 8, background: 'rgba(245,166,35,0.06)', border: '1px solid rgba(245,166,35,0.2)', fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.7 }}>
              💡 <strong style={{ color: 'var(--text-primary)' }}>Note:</strong> Reconciliation matches expenses by Vendor GSTIN. Expenses without a GSTIN cannot be auto-matched. Add GSTINs when logging expenses for the best results. Always confirm with your CA before filing.
            </div>
          </>
        )}
      </main>
    </div>
  );
}
