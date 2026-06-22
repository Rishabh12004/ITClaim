import { useState, useCallback } from 'react';
import Navbar from '../components/Navbar';
import { useDropzone } from 'react-dropzone';
import { Upload, FileText, CheckCircle, X, Zap, AlertTriangle, Brain } from 'lucide-react';
import { checkITCEligibility } from '../utils/itcRules';
import ITCBadge from '../components/ITCBadge';
import axios from 'axios';

export default function Scanner() {
  const [file,        setFile]        = useState(null);
  const [preview,     setPreview]     = useState(null);
  const [scanning,    setScanning]    = useState(false);
  const [scanPhase,   setScanPhase]   = useState(''); // 'ocr' | 'ai' | ''
  const [scanResult,  setScanResult]  = useState(null);
  const [saving,      setSaving]      = useState(false);
  const [saved,       setSaved]       = useState(false);
  const [form,        setForm]        = useState({
    vendorName: '', amount: '', gstPaid: '', category: 'other',
    invoiceDate: '', vendorGstin: '',
  });
  const [error,       setError]       = useState('');
  const [aiUsed,      setAiUsed]      = useState(false); // Was the LLM parse successful?

  const onDrop = useCallback((acceptedFiles) => {
    const f = acceptedFiles[0];
    if (!f) return;
    setFile(f);
    setScanResult(null);
    setSaved(false);
    setError('');
    setAiUsed(false);
    const url = URL.createObjectURL(f);
    setPreview(url);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/*': [], 'application/pdf': [] },
    maxFiles: 1,
    maxSize: 10 * 1024 * 1024,
  });

  const scanInvoice = async () => {
    if (!file) return;
    setScanning(true);
    setError('');
    setAiUsed(false);

    try {
      // ── Step 1: Tesseract OCR — extract raw text from the image ──────────
      setScanPhase('ocr');
      const Tesseract = await import('tesseract.js');
      const { data: { text } } = await Tesseract.default.recognize(file, 'eng', {
        logger: m => console.log('[OCR]', m),
      });

      // ── Step 2: LLM parsing — send raw text to Claude for structured extraction ──
      setScanPhase('ai');
      const parsed = await parseInvoiceText(text);

      const usedAI = !!(parsed._aiParsed);
      setAiUsed(usedAI);
      delete parsed._aiParsed; // internal flag, don't leak into form

      setScanResult({ rawText: text, ...parsed });
      setForm(f => ({
        ...f,
        vendorName:  parsed.vendorName  || f.vendorName,
        amount:      parsed.amount      || f.amount,
        gstPaid:     parsed.gstAmount   || f.gstPaid,
        invoiceDate: parsed.date        || f.invoiceDate,
        vendorGstin: parsed.vendorGSTIN || f.vendorGstin,
      }));
    } catch (err) {
      console.error('Scan error:', err);
      setError('Scanning failed. Please fill in the details manually.');
    } finally {
      setScanning(false);
      setScanPhase('');
    }
  };

  const handleFormChange = (e) => {
    setForm(f => ({ ...f, [e.target.name]: e.target.value }));
  };

  const handleSave = async () => {
    if (!form.vendorName || !form.amount) {
      setError('Vendor name and amount are required.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      const textToCheck = form.vendorName + ' ' + (scanResult?.rawText || '');
      const itc    = checkITCEligibility(textToCheck, form.category);
      const gstAmt = form.gstPaid || Math.round(parseFloat(form.amount) * 0.18).toString();
      await axios.post('/expenses', {
        ...form,
        amount:         parseFloat(form.amount),
        gstPaid:        parseFloat(gstAmt),
        itcStatus:      itc.status,
        itcReason:      itc.reason,
        confidence:     itc.confidence,
        vendorGstin:    form.vendorGstin.trim().toUpperCase() || undefined,
        vendorCompliant: 'unknown', // scanner flow skips live GSTIN check; user can verify separately
      });
      setSaved(true);
    } catch (err) {
      setError(err.response?.data?.message || 'Save failed. Make sure the server is running.');
    } finally {
      setSaving(false);
    }
  };

  const reset = () => {
    setFile(null);
    setPreview(null);
    setScanResult(null);
    setSaved(false);
    setAiUsed(false);
    setForm({ vendorName: '', amount: '', gstPaid: '', category: 'other', invoiceDate: '', vendorGstin: '' });
    setError('');
  };

  const textToCheck = form.vendorName + ' ' + (scanResult?.rawText || '');
  const itcPreview  = form.vendorName.length > 2 ? checkITCEligibility(textToCheck, form.category) : null;

  // Scanning phase label shown on the button
  const scanningLabel = scanPhase === 'ocr'
    ? <><span className="spinner" style={{ width: 14, height: 14 }} /> Reading image with OCR...</>
    : scanPhase === 'ai'
    ? <><Brain size={14} /> 🧠 Reading invoice with AI...</>
    : <><span className="spinner" style={{ width: 14, height: 14 }} /> Processing...</>;

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <Navbar />
      <main className="main-content">

        <div style={{ marginBottom: 28 }}>
          <h1 style={{ fontFamily: 'Space Grotesk', fontSize: 24, fontWeight: 700, marginBottom: 4 }}>Invoice Scanner</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>
            Upload an invoice image — Tesseract OCR reads it, then AI extracts the details
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 20, maxWidth: 960 }}>

          {/* ── Upload area ── */}
          <div className="card">
            <h2 style={{ fontFamily: 'Space Grotesk', fontSize: 16, fontWeight: 600, marginBottom: 16 }}>
              <Upload size={16} style={{ display: 'inline', marginRight: 8 }} />
              Upload Invoice
            </h2>

            {!file ? (
              <div {...getRootProps()} className={`upload-zone ${isDragActive ? 'dragging' : ''}`}>
                <input {...getInputProps()} id="invoice-upload" />
                <div style={{ fontSize: 40, marginBottom: 12 }}>📄</div>
                <p style={{ fontWeight: 600, marginBottom: 6, color: 'var(--text-primary)' }}>
                  {isDragActive ? 'Drop it here!' : 'Drag & drop your invoice'}
                </p>
                <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 16 }}>
                  JPG, PNG, or PDF · Max 10MB
                </p>
                <button type="button" className="btn-secondary">Browse Files</button>
              </div>
            ) : (
              <div>
                {preview && file.type.startsWith('image/') && (
                  <div style={{ position: 'relative', marginBottom: 12 }}>
                    <img src={preview} alt="Invoice preview" style={{
                      width: '100%', borderRadius: 8, border: '1px solid var(--border)',
                      maxHeight: 300, objectFit: 'contain', background: '#fff',
                    }} />
                    <button onClick={reset} style={{
                      position: 'absolute', top: 8, right: 8, background: 'rgba(0,0,0,0.6)',
                      border: 'none', borderRadius: '50%', width: 24, height: 24, cursor: 'pointer',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff',
                    }}>
                      <X size={14} />
                    </button>
                  </div>
                )}
                <div style={{
                  display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px',
                  borderRadius: 8, background: 'var(--bg-elevated)', border: '1px solid var(--border)', marginBottom: 12,
                }}>
                  <FileText size={16} style={{ color: 'var(--accent-green)' }} />
                  <span style={{ fontSize: 13, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{file.name}</span>
                  <button onClick={reset} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}><X size={14} /></button>
                </div>

                {!scanResult && (
                  <button id="scan-btn" onClick={scanInvoice} className="btn-primary"
                    style={{ width: '100%', justifyContent: 'center' }} disabled={scanning}>
                    {scanning ? scanningLabel : <><Zap size={15} /> Scan Invoice</>}
                  </button>
                )}

                {scanResult && (
                  <div style={{
                    padding: '10px 12px', borderRadius: 8, fontSize: 12,
                    background: 'rgba(0,212,170,0.07)', border: '1px solid rgba(0,212,170,0.2)',
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--accent-green)', fontWeight: 600, marginBottom: 4 }}>
                      <CheckCircle size={14} />
                      {aiUsed ? '🧠 AI extracted details — please verify before saving' : 'Scan complete! Fields auto-filled.'}
                    </div>
                    <div style={{ color: 'var(--text-muted)', fontFamily: 'monospace', fontSize: 10, lineHeight: 1.4, maxHeight: 60, overflow: 'hidden' }}>
                      {scanResult.rawText?.slice(0, 200)}...
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* ── Expense details form ── */}
          <div className="card">
            <h2 style={{ fontFamily: 'Space Grotesk', fontSize: 16, fontWeight: 600, marginBottom: 16 }}>
              Expense Details
            </h2>

            {saved ? (
              <div style={{ textAlign: 'center', padding: '40px 20px' }}>
                <div style={{ fontSize: 48, marginBottom: 16 }}>✅</div>
                <h3 style={{ fontFamily: 'Space Grotesk', fontSize: 18, fontWeight: 600, marginBottom: 8 }}>Expense Saved!</h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: 13, marginBottom: 20 }}>
                  {form.vendorName} has been added to your expenses.
                </p>
                {itcPreview && <div style={{ marginBottom: 16 }}><ITCBadge status={itcPreview.status} showConfidence confidence={itcPreview.confidence} /></div>}
                <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
                  <button className="btn-secondary" onClick={reset}>Scan Another</button>
                </div>
              </div>
            ) : (
              <div style={{ display: 'grid', gap: 14 }}>
                {itcPreview && (
                  <div style={{
                    padding: '10px 12px', borderRadius: 8, fontSize: 12,
                    background: itcPreview.status === 'claimable' ? 'rgba(0,212,170,0.07)' : itcPreview.status === 'not_claimable' ? 'rgba(255,77,77,0.07)' : 'rgba(245,166,35,0.07)',
                    border: `1px solid ${itcPreview.status === 'claimable' ? 'rgba(0,212,170,0.2)' : itcPreview.status === 'not_claimable' ? 'rgba(255,77,77,0.2)' : 'rgba(245,166,35,0.2)'}`,
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                      <Zap size={12} style={{ color: 'var(--accent-green)' }} />
                      <span style={{ fontWeight: 600, fontSize: 11, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>ITC detected</span>
                      <ITCBadge status={itcPreview.status} confidence={itcPreview.confidence} showConfidence />
                    </div>
                    <p style={{ color: 'var(--text-muted)', lineHeight: 1.4 }}>{itcPreview.reason}</p>
                  </div>
                )}

                <Field label="Vendor Name *">
                  <input id="scanner-vendor" name="vendorName" value={form.vendorName} onChange={handleFormChange}
                    placeholder="Airtel, AWS, Figma..." className="input-field" />
                </Field>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                  <Field label="Amount (₹) *">
                    <input id="scanner-amount" name="amount" type="number" value={form.amount}
                      onChange={handleFormChange} placeholder="5000" className="input-field" />
                  </Field>
                  <Field label="GST Paid (₹)">
                    <input id="scanner-gst" name="gstPaid" type="number" value={form.gstPaid}
                      onChange={handleFormChange} placeholder="900" className="input-field" />
                  </Field>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                  <Field label="Category">
                    <select id="scanner-category" name="category" value={form.category}
                      onChange={handleFormChange} className="input-field">
                      {['internet','software','hardware','cloud','office','professional','marketing','travel','food','other'].map(c =>
                        <option key={c} value={c}>{c.charAt(0).toUpperCase()+c.slice(1)}</option>
                      )}
                    </select>
                  </Field>
                  <Field label="Invoice Date">
                    <input id="scanner-date" name="invoiceDate" type="date" value={form.invoiceDate}
                      onChange={handleFormChange} className="input-field" />
                  </Field>
                </div>

                {/* V2 — Vendor GSTIN auto-populated from AI scan */}
                <Field label="Vendor GSTIN (auto-detected)">
                  <input id="scanner-gstin" name="vendorGstin" value={form.vendorGstin}
                    onChange={handleFormChange} placeholder="e.g. 27AAPFU0939F1ZV"
                    className="input-field" maxLength={15}
                    style={{ textTransform: 'uppercase', letterSpacing: '0.05em' }} />
                </Field>

                {error && (
                  <div style={{ padding: '8px 12px', borderRadius: 6, background: 'rgba(255,77,77,0.1)', border: '1px solid rgba(255,77,77,0.2)', fontSize: 13, color: 'var(--accent-red)', display: 'flex', gap: 8, alignItems: 'center' }}>
                    <AlertTriangle size={14} /> {error}
                  </div>
                )}

                <button id="scanner-save" onClick={handleSave} className="btn-primary"
                  style={{ width: '100%', justifyContent: 'center' }} disabled={saving}>
                  {saving ? <><span className="spinner" style={{ width: 14, height: 14 }} /> Saving...</> : '✓ Save Expense'}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Tips */}
        <div className="card" style={{ maxWidth: 960, marginTop: 20 }}>
          <h3 style={{ fontFamily: 'Space Grotesk', fontSize: 14, fontWeight: 600, marginBottom: 12 }}>📸 Tips for Better Scanning</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 10 }}>
            {[
              'Use good lighting — avoid shadows on the invoice',
              'Make sure all text is clearly visible and not blurred',
              'Ensure the invoice is flat, not crumpled',
              'Higher resolution = better OCR accuracy',
            ].map((tip, i) => (
              <div key={i} style={{ fontSize: 12, color: 'var(--text-secondary)', display: 'flex', gap: 8 }}>
                <span style={{ color: 'var(--accent-green)', flexShrink: 0 }}>→</span>
                {tip}
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <div>
      <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 5, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</label>
      {children}
    </div>
  );
}

// ── V2: LLM-powered invoice parser (primary) ────────────────────────────────
// Sends the raw OCR text to Claude claude-sonnet-4-6 via the Anthropic API.
// Returns a structured object with vendorName, amount, gstAmount, date, vendorGSTIN.
// Sets _aiParsed: true on success so the UI can show the AI-verified banner.
async function parseInvoiceText(rawText) {
  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
        max_tokens: 500,
        messages: [{
          role: 'user',
          content: `Extract information from this Indian GST invoice text. Return ONLY a JSON object with these exact keys:
{
  "vendorName": "company name that issued the invoice",
  "amount": "base amount as number string without GST, without rupee symbol",
  "gstAmount": "total GST amount as number string (CGST+SGST or IGST combined)",
  "date": "date in YYYY-MM-DD format",
  "vendorGSTIN": "vendor GSTIN if found, else empty string"
}
If a field cannot be found, use empty string. Do not include any explanation or markdown.

Invoice text:
${rawText}`,
        }],
      }),
    });

    const data = await response.json();
    const text = data?.content?.[0]?.text?.trim() || '';
    const clean = text.replace(/```json|```/g, '').trim();
    const parsed = JSON.parse(clean);
    return { ...parsed, _aiParsed: true };

  } catch (err) {
    console.warn('LLM parse failed — falling back to regex:', err.message);
    return parseInvoiceTextFallback(rawText);
  }
}

// ── Fallback: original regex-based parser (used if LLM call fails) ──────────
function parseInvoiceTextFallback(text) {
  const lines = text.split('\n').map(l => l.trim()).filter(Boolean);

  let vendorName = '';
  for (let i = 0; i < Math.min(5, lines.length); i++) {
    if (lines[i].length > 3 && lines[i].length < 70 && !/^\d/.test(lines[i])) {
      let name = lines[i].replace(/tax invoice|bill of supply|cash memo|invoice|receipt/ig, '').trim();
      name = name.replace(/[\/\-\|:\~]+$/g, '').trim();
      if (name.length > 2) { vendorName = name; break; }
    }
  }

  let amount = '', gstAmount = '';
  const amountPatterns = [
    /(?:^|\s)(?:total|amount|grand total|bill amount)[^\d]{0,15}?([0-9,]+(?:\.\d{2})?)/i,
    /(?:₹|rs\.?|inr|¥)[^\d]*([0-9,]+(?:\.\d{2})?)/i,
  ];
  const gstPatterns = [
    /(?:^|\s)(?:gst|igst|cgst|sgst|tax)[^\d]{0,15}?([0-9,]+(?:\.\d{2})?)/i,
    /(?:18%|gst @\s*18)[^\d]*([0-9,]+(?:\.\d{2})?)/i,
  ];
  for (const p of amountPatterns) { const m = text.match(p); if (m) { amount    = m[1].replace(/,/g, ''); break; } }
  for (const p of gstPatterns)    { const m = text.match(p); if (m) { gstAmount = m[1].replace(/,/g, ''); break; } }

  let date = '';
  const datePatterns = [
    /(\d{2})[\/\-\.](\d{2})[\/\-\.](\d{4})/,
    /(\d{1,2})\s+(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\s+(\d{4})/i,
  ];
  for (const p of datePatterns) {
    const m = text.match(p);
    if (m) {
      if (p === datePatterns[0]) {
        let day = parseInt(m[1], 10), month = parseInt(m[2], 10);
        if (month > 12 && day <= 12) { const t = day; day = month; month = t; }
        date = `${m[3]}-${String(month).padStart(2,'0')}-${String(day).padStart(2,'0')}`;
      } else {
        try { const d = new Date(m[0]); if (!isNaN(d)) date = d.toISOString().split('T')[0]; } catch {}
      }
      break;
    }
  }

  return { vendorName, amount, gstAmount, date, vendorGSTIN: '' };
}
