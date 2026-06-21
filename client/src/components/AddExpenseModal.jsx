import { useState, useEffect } from 'react';
import { X, Loader2, Zap } from 'lucide-react';
import { checkITCEligibility } from '../utils/itcRules';
import ITCBadge from './ITCBadge';
import axios from 'axios';

const CATEGORIES = [
  'internet', 'software', 'hardware', 'cloud', 'office',
  'professional', 'marketing', 'travel', 'food', 'other'
];

export default function AddExpenseModal({ onClose, onSave, prefill }) {
  const [form, setForm] = useState({
    vendorName: prefill?.vendorName || '',
    description: prefill?.description || '',
    amount: prefill?.amount || '',
    gstPaid: prefill?.gstPaid || '',
    category: prefill?.category || 'other',
    invoiceDate: prefill?.invoiceDate || new Date().toISOString().split('T')[0],
  });
  const [itcResult, setItcResult] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [gstAutoCalc, setGstAutoCalc] = useState(!prefill?.gstPaid);

  // Auto-calc GST (18%) when amount changes
  useEffect(() => {
    if (form.amount && gstAutoCalc) {
      const gst = Math.round(parseFloat(form.amount) * 0.18);
      setForm(f => ({ ...f, gstPaid: gst.toString() }));
    }
  }, [form.amount, gstAutoCalc]);

  // Auto-check ITC
  useEffect(() => {
    if (form.vendorName.length > 2) {
      const result = checkITCEligibility(form.vendorName, form.category);
      setItcResult(result);
    } else {
      setItcResult(null);
    }
  }, [form.vendorName, form.category]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === 'gstPaid') setGstAutoCalc(false);
    setForm(f => ({ ...f, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.vendorName || !form.amount || !form.gstPaid) {
      setError('Vendor name, amount, and GST amount are required.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      const payload = {
        ...form,
        amount: parseFloat(form.amount),
        gstPaid: parseFloat(form.gstPaid),
        itcStatus: itcResult?.status || 'review',
        itcReason: itcResult?.reason || 'Manually entered, needs review',
        confidence: itcResult?.confidence || 'low',
      };
      const res = await axios.post('/expenses', payload);
      onSave(res.data.expense);
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save expense. Make sure the server is running.');
    } finally {
      setSaving(false);
    }
  };

  const itcColors = {
    claimable: { bg: 'rgba(0,212,170,0.08)', border: 'rgba(0,212,170,0.25)' },
    not_claimable: { bg: 'rgba(255,77,77,0.08)', border: 'rgba(255,77,77,0.25)' },
    review: { bg: 'rgba(245,166,35,0.08)', border: 'rgba(245,166,35,0.25)' },
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <h2 style={{ fontFamily: 'Space Grotesk', fontSize: 20, fontWeight: 600 }}>Add Expense</h2>
          <button onClick={onClose} className="btn-ghost" style={{ padding: 6 }}><X size={20} /></button>
        </div>

        {/* Live ITC preview */}
        {itcResult && (
          <div style={{
            padding: '12px 14px', borderRadius: 8, marginBottom: 20,
            background: itcColors[itcResult.status]?.bg,
            border: `1px solid ${itcColors[itcResult.status]?.border}`,
            animation: 'fadeIn 0.2s ease',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
              <Zap size={12} style={{ color: 'var(--accent-green)' }} />
              <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Auto-detected ITC status</span>
              <ITCBadge status={itcResult.status} confidence={itcResult.confidence} showConfidence />
            </div>
            <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>{itcResult.reason}</p>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div style={{ display: 'grid', gap: 14 }}>
            <Field label="Vendor / Expense Name *">
              <input id="vendor-name" name="vendorName" value={form.vendorName} onChange={handleChange}
                placeholder="e.g. AWS, Figma, Airtel Broadband" className="input-field" autoFocus />
            </Field>

            <Field label="Description">
              <input id="expense-desc" name="description" value={form.description} onChange={handleChange}
                placeholder="What was this expense for?" className="input-field" />
            </Field>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <Field label="Base Amount (₹) *">
                <input id="expense-amount" name="amount" type="number" value={form.amount} onChange={handleChange}
                  placeholder="5000" className="input-field" min="0" step="0.01" />
              </Field>
              <Field label={`GST Paid (₹) *${gstAutoCalc ? ' · Auto 18%' : ''}`}>
                <input id="gst-paid" name="gstPaid" type="number" value={form.gstPaid} onChange={handleChange}
                  placeholder="900" className="input-field" min="0" step="0.01" />
              </Field>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <Field label="Category">
                <select id="expense-category" name="category" value={form.category} onChange={handleChange} className="input-field">
                  {CATEGORIES.map(c => <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>)}
                </select>
              </Field>
              <Field label="Invoice Date">
                <input id="invoice-date" name="invoiceDate" type="date" value={form.invoiceDate} onChange={handleChange}
                  className="input-field" />
              </Field>
            </div>
          </div>

          {/* Total summary */}
          {form.amount && form.gstPaid && (
            <div style={{ marginTop: 14, padding: '10px 14px', borderRadius: 8, background: 'var(--bg-elevated)', border: '1px solid var(--border)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'var(--text-secondary)', marginBottom: 4 }}>
                <span>Base amount</span>
                <span className="amount-green">₹{parseFloat(form.amount || 0).toLocaleString('en-IN')}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'var(--text-secondary)', marginBottom: 4 }}>
                <span>GST paid</span>
                <span style={{ color: itcResult?.status === 'claimable' ? 'var(--accent-green)' : 'var(--text-secondary)' }}>
                  ₹{parseFloat(form.gstPaid || 0).toLocaleString('en-IN')}
                </span>
              </div>
              <div style={{ height: 1, background: 'var(--border)', margin: '6px 0' }} />
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, fontWeight: 600 }}>
                <span>Total paid</span>
                <span>₹{(parseFloat(form.amount || 0) + parseFloat(form.gstPaid || 0)).toLocaleString('en-IN')}</span>
              </div>
              {itcResult?.status === 'claimable' && (
                <div style={{ marginTop: 6, fontSize: 12, color: 'var(--accent-green)', fontWeight: 500 }}>
                  ✓ ₹{parseFloat(form.gstPaid || 0).toLocaleString('en-IN')} will be added to your ITC balance
                </div>
              )}
            </div>
          )}

          {error && (
            <div style={{ marginTop: 12, padding: '8px 12px', borderRadius: 6, background: 'rgba(255,77,77,0.1)', border: '1px solid rgba(255,77,77,0.2)', fontSize: 13, color: 'var(--accent-red)' }}>
              {error}
            </div>
          )}

          <div style={{ display: 'flex', gap: 12, marginTop: 24 }}>
            <button type="button" id="cancel-expense" onClick={onClose} className="btn-secondary" style={{ flex: 1 }}>Cancel</button>
            <button type="submit" id="save-expense" className="btn-primary" style={{ flex: 2 }} disabled={saving}>
              {saving ? (
                <><span className="spinner" style={{ width: 14, height: 14 }} /> Saving...</>
              ) : '+ Add Expense'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <div>
      <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
        {label}
      </label>
      {children}
    </div>
  );
}
