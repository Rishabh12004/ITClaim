import { useState, useCallback, useRef } from 'react';
import Navbar from '../components/Navbar';
import { useDropzone } from 'react-dropzone';
import { Upload, FileText, Loader2, CheckCircle, X, Zap, AlertTriangle } from 'lucide-react';
import { checkITCEligibility } from '../utils/itcRules';
import ITCBadge from '../components/ITCBadge';
import axios from 'axios';

export default function Scanner() {
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [scanning, setScanning] = useState(false);
  const [scanResult, setScanResult] = useState(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [form, setForm] = useState({ vendorName: '', amount: '', gstPaid: '', category: 'other', invoiceDate: '' });
  const [error, setError] = useState('');

  const onDrop = useCallback((acceptedFiles) => {
    const f = acceptedFiles[0];
    if (!f) return;
    setFile(f);
    setScanResult(null);
    setSaved(false);
    setError('');

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

    try {
      // Dynamic import for Tesseract to keep bundle lean
      const Tesseract = await import('tesseract.js');
      const { data: { text } } = await Tesseract.default.recognize(file, 'eng', {
        logger: m => console.log(m),
      });

      // Parse the text for vendor, amount, GST
      const parsed = parseInvoiceText(text);
      setScanResult({ rawText: text, ...parsed });
      setForm(f => ({
        ...f,
        vendorName: parsed.vendorName || f.vendorName,
        amount: parsed.amount || f.amount,
        gstPaid: parsed.gstAmount || f.gstPaid,
        invoiceDate: parsed.date || f.invoiceDate,
      }));
    } catch (err) {
      console.error('OCR error:', err);
      setError('OCR scanning failed. Please fill in the details manually.');
    } finally {
      setScanning(false);
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
      const itc = checkITCEligibility(textToCheck, form.category);
      const gstAmt = form.gstPaid || Math.round(parseFloat(form.amount) * 0.18).toString();
      await axios.post('/expenses', {
        ...form,
        amount: parseFloat(form.amount),
        gstPaid: parseFloat(gstAmt),
        itcStatus: itc.status,
        itcReason: itc.reason,
        confidence: itc.confidence,
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
    setForm({ vendorName: '', amount: '', gstPaid: '', category: 'other', invoiceDate: '' });
    setError('');
  };

  const textToCheck = form.vendorName + ' ' + (scanResult?.rawText || '');
  const itcPreview = form.vendorName.length > 2 ? checkITCEligibility(textToCheck, form.category) : null;

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <Navbar />
      <main className="main-content">

        <div style={{ marginBottom: 28 }}>
          <h1 style={{ fontFamily: 'Space Grotesk', fontSize: 24, fontWeight: 700, marginBottom: 4 }}>Invoice Scanner</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>Upload an invoice image and we'll extract the details automatically</p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 20, maxWidth: 960 }}>

          {/* Upload area */}
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
                    <img src={preview} alt="Invoice preview" style={{ width: '100%', borderRadius: 8, border: '1px solid var(--border)', maxHeight: 300, objectFit: 'contain', background: '#fff' }} />
                    <button onClick={reset} style={{ position: 'absolute', top: 8, right: 8, background: 'rgba(0,0,0,0.6)', border: 'none', borderRadius: '50%', width: 24, height: 24, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>
                      <X size={14} />
                    </button>
                  </div>
                )}
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', borderRadius: 8, background: 'var(--bg-elevated)', border: '1px solid var(--border)', marginBottom: 12 }}>
                  <FileText size={16} style={{ color: 'var(--accent-green)' }} />
                  <span style={{ fontSize: 13, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{file.name}</span>
                  <button onClick={reset} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}><X size={14} /></button>
                </div>

                {!scanResult && (
                  <button id="scan-btn" onClick={scanInvoice} className="btn-primary" style={{ width: '100%', justifyContent: 'center' }} disabled={scanning}>
                    {scanning ? (
                      <><span className="spinner" style={{ width: 14, height: 14 }} /> Scanning with OCR...</>
                    ) : (
                      <><Zap size={15} /> Scan Invoice</>
                    )}
                  </button>
                )}

                {scanResult && (
                  <div style={{ padding: '10px 12px', borderRadius: 8, background: 'rgba(0,212,170,0.07)', border: '1px solid rgba(0,212,170,0.2)', fontSize: 12 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--accent-green)', fontWeight: 600, marginBottom: 4 }}>
                      <CheckCircle size={14} />
                      Scan complete! Fields auto-filled.
                    </div>
                    <div style={{ color: 'var(--text-muted)', fontFamily: 'monospace', fontSize: 10, lineHeight: 1.4, maxHeight: 60, overflow: 'hidden' }}>
                      {scanResult.rawText?.slice(0, 200)}...
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Form */}
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
                  <input id="scanner-vendor" name="vendorName" value={form.vendorName} onChange={handleFormChange} placeholder="Airtel, AWS, Figma..." className="input-field" />
                </Field>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                  <Field label="Amount (₹) *">
                    <input id="scanner-amount" name="amount" type="number" value={form.amount} onChange={handleFormChange} placeholder="5000" className="input-field" />
                  </Field>
                  <Field label="GST Paid (₹)">
                    <input id="scanner-gst" name="gstPaid" type="number" value={form.gstPaid} onChange={handleFormChange} placeholder="900" className="input-field" />
                  </Field>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                  <Field label="Category">
                    <select id="scanner-category" name="category" value={form.category} onChange={handleFormChange} className="input-field">
                      {['internet','software','hardware','cloud','office','professional','marketing','travel','food','other'].map(c =>
                        <option key={c} value={c}>{c.charAt(0).toUpperCase()+c.slice(1)}</option>
                      )}
                    </select>
                  </Field>
                  <Field label="Invoice Date">
                    <input id="scanner-date" name="invoiceDate" type="date" value={form.invoiceDate} onChange={handleFormChange} className="input-field" />
                  </Field>
                </div>

                {error && (
                  <div style={{ padding: '8px 12px', borderRadius: 6, background: 'rgba(255,77,77,0.1)', border: '1px solid rgba(255,77,77,0.2)', fontSize: 13, color: 'var(--accent-red)', display: 'flex', gap: 8, alignItems: 'center' }}>
                    <AlertTriangle size={14} /> {error}
                  </div>
                )}

                <button id="scanner-save" onClick={handleSave} className="btn-primary" style={{ width: '100%', justifyContent: 'center' }} disabled={saving}>
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

function parseInvoiceText(text) {
  const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
  
  // Try to extract vendor (usually first few lines)
  let vendorName = '';
  for (let i = 0; i < Math.min(5, lines.length); i++) {
    if (lines[i].length > 3 && lines[i].length < 70 && !/^\d/.test(lines[i])) {
      // Clean up messy vendor names by removing common invoice words
      let name = lines[i].replace(/tax invoice|bill of supply|cash memo|invoice|receipt/ig, '').trim();
      name = name.replace(/[\/\-\|\:\~]+$/g, '').trim(); // Remove trailing punctuation
      if (name.length > 2) {
        vendorName = name;
        break;
      }
    }
  }

  // Try to extract amount (look for patterns like ₹, Rs., Total, Amount)
  let amount = '';
  let gstAmount = '';
  const amountPatterns = [
    /(?:total|amount|grand total|bill amount)[:\s]+(?:₹|rs\.?|inr)?\s*([0-9,]+(?:\.\d{2})?)/i,
    /(?:₹|rs\.?)\s*([0-9,]+(?:\.\d{2})?)/i,
  ];
  const gstPatterns = [
    /(?:gst|igst|cgst\s*\+\s*sgst|tax)[:\s]+(?:₹|rs\.?|inr)?\s*([0-9,]+(?:\.\d{2})?)/i,
    /(?:18%|gst @\s*18)[:\s]+(?:₹|rs\.?|inr)?\s*([0-9,]+(?:\.\d{2})?)/i,
  ];

  for (const pattern of amountPatterns) {
    const m = text.match(pattern);
    if (m) { amount = m[1].replace(/,/g, ''); break; }
  }
  for (const pattern of gstPatterns) {
    const m = text.match(pattern);
    if (m) { gstAmount = m[1].replace(/,/g, ''); break; }
  }

  // Try to extract date
  let date = '';
  const datePatterns = [
    /(\d{2})[\/\-\.](\d{2})[\/\-\.](\d{4})/,
    /(\d{1,2})\s+(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\s+(\d{4})/i,
  ];
  for (const pattern of datePatterns) {
    const m = text.match(pattern);
    if (m) {
      if (pattern === datePatterns[0]) {
        // Handle DD.MM.YYYY or DD/MM/YYYY
        let day = parseInt(m[1], 10);
        let month = parseInt(m[2], 10);
        // If month > 12, it must be MM/DD/YYYY format, so swap them
        if (month > 12 && day <= 12) {
          const temp = day; day = month; month = temp;
        }
        date = `${m[3]}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      } else {
        try {
          const d = new Date(m[0]);
          if (!isNaN(d)) date = d.toISOString().split('T')[0];
        } catch {}
      }
      break;
    }
  }

  return { vendorName, amount, gstAmount, date };
}
