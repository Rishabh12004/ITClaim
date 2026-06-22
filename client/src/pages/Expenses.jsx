import { useEffect, useState } from 'react';
import Navbar from '../components/Navbar';
import ITCBadge from '../components/ITCBadge';
import AddExpenseModal from '../components/AddExpenseModal';
import { Plus, Search, Trash2, ShieldCheck, ShieldX, ShieldAlert } from 'lucide-react';
import axios from 'axios';

const CATEGORIES = ['all', 'internet', 'software', 'hardware', 'cloud', 'office', 'professional', 'marketing', 'travel', 'food', 'other'];
const STATUSES   = ['all', 'claimable', 'not_claimable', 'review'];

// V2 — Small shield icon shown next to the ITC badge in the table.
// Communicates whether the vendor's GST registration was verified as active.
function VendorComplianceBadge({ compliant }) {
  if (!compliant || compliant === 'unknown') return null;

  if (compliant === 'yes') {
    return (
      <span
        title="Vendor GST verified active — your ITC is likely safe"
        style={{ display: 'inline-flex', alignItems: 'center', marginLeft: 5, color: 'var(--accent-green)', verticalAlign: 'middle' }}
      >
        <ShieldCheck size={13} />
      </span>
    );
  }

  if (compliant === 'no') {
    return (
      <span
        title="Vendor GST is inactive — this ITC may be rejected by the tax department"
        style={{ display: 'inline-flex', alignItems: 'center', marginLeft: 5, color: 'var(--accent-red)', verticalAlign: 'middle' }}
      >
        <ShieldX size={13} />
      </span>
    );
  }

  return null;
}

export default function Expenses() {
  const [expenses,        setExpenses]        = useState([]);
  const [loading,         setLoading]         = useState(true);
  const [showModal,       setShowModal]       = useState(false);
  const [search,          setSearch]          = useState('');
  const [filterStatus,    setFilterStatus]    = useState('all');
  const [filterCategory,  setFilterCategory]  = useState('all');
  const [filterMonth,     setFilterMonth]     = useState(new Date().toISOString().slice(0, 7));
  const [deleting,        setDeleting]        = useState(null);

  const fetchExpenses = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filterMonth) params.set('month', filterMonth);
      if (filterStatus !== 'all') params.set('status', filterStatus);
      if (filterCategory !== 'all') params.set('category', filterCategory);
      const res = await axios.get(`/expenses?${params}`);
      setExpenses(res.data.expenses || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchExpenses(); }, [filterMonth, filterStatus, filterCategory]);

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this expense?')) return;
    setDeleting(id);
    try {
      await axios.delete(`/expenses/${id}`);
      setExpenses(prev => prev.filter(e => e._id !== id));
    } catch (err) {
      console.error(err);
    } finally {
      setDeleting(null);
    }
  };

  const filtered   = expenses.filter(e =>
    e.vendorName?.toLowerCase().includes(search.toLowerCase()) ||
    e.description?.toLowerCase().includes(search.toLowerCase())
  );
  const totalITC   = filtered.filter(e => e.itcStatus === 'claimable').reduce((s, e) => s + (e.gstPaid || 0), 0);
  const totalGST   = filtered.reduce((s, e) => s + (e.gstPaid || 0), 0);

  // V2 — count at-risk expenses (ITC logged but vendor compliance failed)
  const atRiskCount = filtered.filter(e => e.vendorCompliant === 'no').length;

  // Generate last 12 months for the month filter dropdown
  const monthOptions = [];
  const now = new Date();
  for (let i = 0; i < 12; i++) {
    const d   = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const val = d.toISOString().slice(0, 7);
    const label = d.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });
    monthOptions.push({ val, label });
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <Navbar />
      <main className="main-content">

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
          <div>
            <h1 style={{ fontFamily: 'Space Grotesk', fontSize: 24, fontWeight: 700, marginBottom: 4 }}>Expenses</h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>Track and manage all your business expenses</p>
          </div>
          <button id="expenses-add-btn" onClick={() => setShowModal(true)} className="btn-primary">
            <Plus size={16} /> Add Expense
          </button>
        </div>

        {/* Summary strip */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12, marginBottom: 20 }}>
          {[
            { label: 'Total Expenses',  value: filtered.length,                                                             unit: 'records' },
            { label: 'Total GST Paid',  value: `₹${totalGST.toLocaleString('en-IN')}`,                                    color: 'var(--text-primary)' },
            { label: 'ITC Claimable',   value: `₹${totalITC.toLocaleString('en-IN')}`,                                    color: 'var(--accent-green)' },
            { label: 'Recovery Rate',   value: totalGST > 0 ? `${Math.round((totalITC / totalGST) * 100)}%` : '—',       color: 'var(--accent-green)' },
          ].map(s => (
            <div key={s.label} className="card" style={{ padding: '14px 16px' }}>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 }}>{s.label}</div>
              <div style={{ fontFamily: 'Space Grotesk', fontSize: 22, fontWeight: 700, color: s.color || 'var(--text-primary)' }}>{s.value}</div>
            </div>
          ))}
        </div>

        {/* V2 — At-risk warning banner (vendor GST inactive) */}
        {atRiskCount > 0 && (
          <div style={{ marginBottom: 16, padding: '10px 16px', borderRadius: 8, background: 'rgba(255,77,77,0.07)', border: '1px solid rgba(255,77,77,0.2)', fontSize: 13, color: 'var(--accent-red)', display: 'flex', alignItems: 'center', gap: 8 }}>
            <ShieldX size={15} style={{ flexShrink: 0 }} />
            <span>
              <strong>{atRiskCount} expense{atRiskCount > 1 ? 's' : ''}</strong> flagged — vendor GST is inactive. The tax department may reject this ITC. Consult your CA.
            </span>
          </div>
        )}

        {/* Filters */}
        <div className="card" style={{ marginBottom: 16, padding: 16 }}>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
            {/* Search */}
            <div style={{ position: 'relative', flex: '1', minWidth: 200 }}>
              <Search size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input
                id="expense-search"
                value={search} onChange={e => setSearch(e.target.value)}
                placeholder="Search vendor or description..."
                className="input-field" style={{ paddingLeft: 36 }}
              />
            </div>

            {/* Month filter */}
            <div>
              <select id="filter-month" value={filterMonth} onChange={e => setFilterMonth(e.target.value)} className="input-field" style={{ paddingRight: 32, minWidth: 160 }}>
                {monthOptions.map(m => <option key={m.val} value={m.val}>{m.label}</option>)}
              </select>
            </div>

            {/* Status filter */}
            <div>
              <select id="filter-status" value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="input-field" style={{ minWidth: 140 }}>
                <option value="all">All Status</option>
                <option value="claimable">✓ Claimable</option>
                <option value="not_claimable">✗ Not Claimable</option>
                <option value="review">⚠ Review</option>
              </select>
            </div>

            {/* Category filter */}
            <div>
              <select id="filter-category" value={filterCategory} onChange={e => setFilterCategory(e.target.value)} className="input-field" style={{ minWidth: 130 }}>
                {CATEGORIES.map(c => <option key={c} value={c}>{c === 'all' ? 'All Categories' : c.charAt(0).toUpperCase() + c.slice(1)}</option>)}
              </select>
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          {loading ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}>
              <span className="spinner" style={{ width: 32, height: 32 }} />
            </div>
          ) : filtered.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">🔍</div>
              <div className="empty-state-title">No expenses found</div>
              <div className="empty-state-desc">Try adjusting your filters or add a new expense</div>
              <button className="btn-primary" onClick={() => setShowModal(true)}><Plus size={15} /> Add Expense</button>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table className="data-table" style={{ minWidth: 700 }}>
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Vendor / Description</th>
                    <th>Category</th>
                    <th>Amount</th>
                    <th>GST Paid</th>
                    <th>ITC Status</th>
                    <th>Reason</th>
                    <th style={{ width: 48 }}></th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(expense => (
                    <tr key={expense._id}>
                      <td style={{ fontSize: 12, color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                        {new Date(expense.invoiceDate || expense.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                      </td>

                      <td>
                        <div style={{ fontWeight: 500, fontSize: 13 }}>{expense.vendorName}</div>
                        {expense.description && <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{expense.description}</div>}
                        {/* V2 — Show GSTIN in small text if it was captured */}
                        {expense.vendorGstin && (
                          <div style={{ fontSize: 10, color: 'var(--text-muted)', fontFamily: 'monospace', marginTop: 2 }}>
                            GSTIN: {expense.vendorGstin}
                          </div>
                        )}
                      </td>

                      <td>
                        <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 100, background: 'var(--bg-elevated)', border: '1px solid var(--border)', color: 'var(--text-muted)' }}>
                          {expense.category}
                        </span>
                      </td>

                      <td style={{ fontFamily: 'JetBrains Mono', fontSize: 13, whiteSpace: 'nowrap' }}>
                        ₹{Number(expense.amount).toLocaleString('en-IN')}
                      </td>

                      <td style={{ fontFamily: 'JetBrains Mono', fontSize: 13, whiteSpace: 'nowrap', color: expense.itcStatus === 'claimable' ? 'var(--accent-green)' : 'var(--text-secondary)' }}>
                        ₹{Number(expense.gstPaid).toLocaleString('en-IN')}
                      </td>

                      {/* V2 — ITC badge + vendor compliance shield side by side */}
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                          <ITCBadge status={expense.itcStatus} />
                          <VendorComplianceBadge compliant={expense.vendorCompliant} />
                        </div>
                      </td>

                      <td style={{ fontSize: 11, color: 'var(--text-muted)', maxWidth: 200 }}>
                        <span title={expense.itcReason} style={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                          {expense.itcReason}
                        </span>
                      </td>

                      <td>
                        <button
                          id={`delete-expense-${expense._id}`}
                          onClick={() => handleDelete(expense._id)}
                          disabled={deleting === expense._id}
                          style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: 6, borderRadius: 6, transition: 'color 0.2s' }}
                          onMouseEnter={e => e.currentTarget.style.color = 'var(--accent-red)'}
                          onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}
                        >
                          {deleting === expense._id ? <span className="spinner" style={{ width: 12, height: 12 }} /> : <Trash2 size={14} />}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Review tip */}
        {filtered.some(e => e.itcStatus === 'review') && (
          <div style={{ marginTop: 16, padding: '12px 16px', borderRadius: 8, background: 'rgba(245,166,35,0.07)', border: '1px solid rgba(245,166,35,0.2)', fontSize: 13, color: 'var(--text-secondary)' }}>
            ⚠️ You have {filtered.filter(e => e.itcStatus === 'review').length} expense(s) that need review. These could be partially claimable — consult your CA.
          </div>
        )}
      </main>

      {showModal && <AddExpenseModal onClose={() => setShowModal(false)} onSave={(e) => setExpenses(prev => [e, ...prev])} />}
    </div>
  );
}
