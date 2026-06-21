import { useEffect, useState } from 'react';
import Navbar from '../components/Navbar';
import SavingsWidget from '../components/SavingsWidget';
import DeadlineBanner from '../components/DeadlineBanner';
import ITCBadge from '../components/ITCBadge';
import AddExpenseModal from '../components/AddExpenseModal';
import { useAuth } from '../context/AuthContext';
import { Plus, TrendingUp, Receipt, Clock, ArrowRight, RefreshCw } from 'lucide-react';
import axios from 'axios';
import { Link } from 'react-router-dom';

export default function Dashboard() {
  const { user } = useAuth();
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [stats, setStats] = useState({ claimable: 0, notClaimable: 0, review: 0, total: 0, count: 0 });

  const fetchExpenses = async () => {
    try {
      const month = new Date().toISOString().slice(0, 7);
      const res = await axios.get(`/expenses?month=${month}&limit=6`);
      const data = res.data.expenses || [];
      setExpenses(data);

      // Calculate stats
      const s = data.reduce((acc, e) => {
        acc.total += (e.amount || 0) + (e.gstPaid || 0);
        acc.count++;
        if (e.itcStatus === 'claimable') acc.claimable += (e.gstPaid || 0);
        else if (e.itcStatus === 'not_claimable') acc.notClaimable += (e.gstPaid || 0);
        else acc.review += (e.gstPaid || 0);
        return acc;
      }, { claimable: 0, notClaimable: 0, review: 0, total: 0, count: 0 });
      setStats(s);
    } catch (err) {
      console.error('Failed to fetch expenses:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExpenses();
  }, []);

  const handleSave = (expense) => {
    setExpenses(prev => [expense, ...prev].slice(0, 6));
    // Recalc stats
    setStats(prev => {
      const s = { ...prev };
      s.count++;
      s.total += (expense.amount || 0) + (expense.gstPaid || 0);
      if (expense.itcStatus === 'claimable') s.claimable += (expense.gstPaid || 0);
      else if (expense.itcStatus === 'not_claimable') s.notClaimable += (expense.gstPaid || 0);
      else s.review += (expense.gstPaid || 0);
      return s;
    });
  };

  const currentMonth = new Date().toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <Navbar />

      {/* Main */}
      <main className="main-content">

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
          <div className="animate-fade-in-up">
            <h1 style={{ fontFamily: 'Space Grotesk', fontSize: 24, fontWeight: 700, marginBottom: 4 }}>
              Good {getGreeting()}, {user?.name?.split(' ')[0]} 👋
            </h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>Here's your ITC summary for {currentMonth}</p>
          </div>
          <button id="add-expense-btn" onClick={() => setShowModal(true)} className="btn-primary animate-fade-in">
            <Plus size={16} /> Add Expense
          </button>
        </div>

        {/* Deadline banner */}
        <DeadlineBanner />

        {/* Hero widget */}
        <div className="animate-fade-in-up delay-100">
          <SavingsWidget
            claimable={stats.claimable}
            notClaimable={stats.notClaimable}
            review={stats.review}
          />
        </div>

        {/* Quick stats row */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 16, marginBottom: 24 }}
          className="animate-fade-in-up delay-200">
          <StatCard icon={<Receipt size={18} />} label="Total Expenses" value={stats.count} unit="this month" />
          <StatCard icon={<TrendingUp size={18} />} label="Total Spent" value={`₹${stats.total.toLocaleString('en-IN')}`} unit="incl. GST" />
          <StatCard icon={<Clock size={18} />} label="Pending Review" value={expenses.filter(e => e.itcStatus === 'review').length} unit="expenses" color="var(--accent-amber)" />
        </div>

        {/* Recent expenses */}
        <div className="card animate-fade-in-up delay-300">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <h2 style={{ fontFamily: 'Space Grotesk', fontSize: 16, fontWeight: 600 }}>Recent Expenses</h2>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <button onClick={fetchExpenses} className="btn-ghost" style={{ padding: '6px 8px', fontSize: 12 }}>
                <RefreshCw size={13} />
              </button>
              <Link to="/expenses" style={{ textDecoration: 'none' }}>
                <button className="btn-ghost" style={{ fontSize: 12 }}>View All <ArrowRight size={13} /></button>
              </Link>
            </div>
          </div>

          {loading ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: 40 }}>
              <span className="spinner" style={{ width: 28, height: 28 }} />
            </div>
          ) : expenses.length === 0 ? (
            <EmptyExpenses onAdd={() => setShowModal(true)} />
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table className="data-table" style={{ minWidth: 600 }}>
                <thead>
                  <tr>
                    <th>Vendor</th>
                    <th>Category</th>
                    <th>Amount</th>
                    <th>GST Paid</th>
                    <th>ITC Status</th>
                  </tr>
                </thead>
                <tbody>
                  {expenses.map(expense => (
                    <tr key={expense._id}>
                      <td>
                        <div style={{ fontWeight: 500 }}>{expense.vendorName}</div>
                        {expense.description && <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{expense.description}</div>}
                      </td>
                      <td>
                        <span style={{
                          fontSize: 11, padding: '2px 8px', borderRadius: 100,
                          background: 'var(--bg-elevated)', border: '1px solid var(--border)', color: 'var(--text-muted)'
                        }}>{expense.category}</span>
                      </td>
                      <td style={{ fontFamily: 'JetBrains Mono', fontSize: 13 }}>₹{Number(expense.amount).toLocaleString('en-IN')}</td>
                      <td style={{ fontFamily: 'JetBrains Mono', fontSize: 13, color: expense.itcStatus === 'claimable' ? 'var(--accent-green)' : 'var(--text-secondary)' }}>
                        ₹{Number(expense.gstPaid).toLocaleString('en-IN')}
                      </td>
                      <td><ITCBadge status={expense.itcStatus} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Quick tips */}
        <div className="card animate-fade-in-up delay-400" style={{ marginTop: 20 }}>
          <h2 style={{ fontFamily: 'Space Grotesk', fontSize: 16, fontWeight: 600, marginBottom: 12 }}>💡 Did You Know?</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 12 }}>
            {[
              { tip: 'ITC must be claimed within the same financial year. Don\'t let it expire!', color: 'var(--accent-amber)' },
              { tip: 'Your vendor must have filed their GST return for your ITC to be valid.', color: 'var(--accent-green)' },
              { tip: 'Keep all invoices for 6 years — the GST department can audit anytime.', color: 'var(--accent-red)' },
            ].map((t, i) => (
              <div key={i} style={{
                padding: '12px 14px', borderRadius: 8, fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.5,
                background: `${t.color}0A`, border: `1px solid ${t.color}22`,
              }}>
                {t.tip}
              </div>
            ))}
          </div>
        </div>
      </main>

      {showModal && <AddExpenseModal onClose={() => setShowModal(false)} onSave={handleSave} />}
    </div>
  );
}

function StatCard({ icon, label, value, unit, color = 'var(--accent-green)' }) {
  return (
    <div className="card" style={{ padding: 16 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, color, marginBottom: 10 }}>
        {icon}
        <span style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)' }}>{label}</span>
      </div>
      <div style={{ fontFamily: 'Space Grotesk', fontSize: 26, fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1 }}>{value}</div>
      {unit && <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>{unit}</div>}
    </div>
  );
}

function EmptyExpenses({ onAdd }) {
  return (
    <div className="empty-state">
      <div className="empty-state-icon">📋</div>
      <div className="empty-state-title">No expenses yet</div>
      <div className="empty-state-desc">Start by adding your first business expense to see your ITC potential</div>
      <button className="btn-primary" onClick={onAdd}><Plus size={15} /> Add First Expense</button>
    </div>
  );
}

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'morning';
  if (h < 18) return 'afternoon';
  return 'evening';
}
