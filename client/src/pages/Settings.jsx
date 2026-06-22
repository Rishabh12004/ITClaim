import { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import { useAuth } from '../context/AuthContext';
import { User, Building, Shield, Bell, Save, CheckCircle, Loader2 } from 'lucide-react';
import axios from 'axios';

export default function Settings() {
  const { user, updateUser } = useAuth();
  const [form, setForm] = useState({
    name:         user?.name         || '',
    email:        user?.email        || '',
    businessName: user?.businessName || '',
    gstin:        user?.gstin        || '',
  });
  // V2 — email reminder preference (default true, matches User model default)
  const [emailReminders, setEmailReminders] = useState(
    user?.emailReminders !== undefined ? user.emailReminders : true
  );
  const [saving, setSaving] = useState(false);
  const [saved,  setSaved]  = useState(false);
  const [error,  setError]  = useState('');
  // V2 — separate saving state for the reminders toggle so it saves independently
  const [savingReminders, setSavingReminders] = useState(false);

  useEffect(() => {
    if (user) {
      setForm({
        name:         user.name         || '',
        email:        user.email        || '',
        businessName: user.businessName || '',
        gstin:        user.gstin        || '',
      });
      // Sync toggle from server whenever user object refreshes
      if (user.emailReminders !== undefined) setEmailReminders(user.emailReminders);
    }
  }, [user]);

  const handleChange = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setSaved(false);
    setError('');
    try {
      // V2 — also persist emailReminders alongside profile fields
      const res = await axios.put('/auth/profile', { ...form, emailReminders });
      updateUser(res.data.user);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save settings.');
    } finally {
      setSaving(false);
    }
  };

  // V2 — Save just the reminder toggle immediately when flipped (no need to hit Save)
  const handleToggleReminders = async (checked) => {
    setEmailReminders(checked);
    setSavingReminders(true);
    try {
      const res = await axios.put('/auth/profile', { ...form, emailReminders: checked });
      updateUser(res.data.user);
    } catch (err) {
      // Revert toggle on failure
      setEmailReminders(!checked);
      console.error('Failed to save reminder preference:', err.message);
    } finally {
      setSavingReminders(false);
    }
  };

  const gstinValid = form.gstin.length === 0 || /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/.test(form.gstin);

  const filingMonth = new Date();
  const daysLeft = 20 - filingMonth.getDate();
  const currentMonth = filingMonth.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <Navbar />
      <main className="main-content" style={{ maxWidth: 1000 }}>

        <div style={{ marginBottom: 28 }}>
          <h1 style={{ fontFamily: 'Space Grotesk', fontSize: 24, fontWeight: 700, marginBottom: 4 }}>Settings</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>Manage your profile and preferences</p>
        </div>

        {/* Profile section */}
        <form onSubmit={handleSave}>
          {/* Profile info */}
          <div className="card" style={{ marginBottom: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(0,212,170,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent-green)' }}>
                <User size={18} />
              </div>
              <h2 style={{ fontFamily: 'Space Grotesk', fontSize: 16, fontWeight: 600 }}>Profile Information</h2>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 14 }}>
              <Field label="Full Name *">
                <input id="settings-name" name="name" value={form.name} onChange={handleChange} placeholder="Your name" className="input-field" required />
              </Field>
              <Field label="Email *">
                <input id="settings-email" name="email" type="email" value={form.email} onChange={handleChange} placeholder="you@example.com" className="input-field" required />
              </Field>
            </div>
          </div>

          {/* Business info */}
          <div className="card" style={{ marginBottom: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(0,212,170,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent-green)' }}>
                <Building size={18} />
              </div>
              <h2 style={{ fontFamily: 'Space Grotesk', fontSize: 16, fontWeight: 600 }}>Business Details</h2>
            </div>

            <div style={{ display: 'grid', gap: 14 }}>
              <Field label="Business / Freelance Name">
                <input id="settings-business" name="businessName" value={form.businessName} onChange={handleChange} placeholder="Your business or freelance brand name" className="input-field" />
              </Field>
              <Field label="GSTIN">
                <input id="settings-gstin" name="gstin" value={form.gstin} onChange={handleChange}
                  placeholder="22AAAAA0000A1Z5" className="input-field"
                  style={{
                    fontFamily: 'JetBrains Mono', letterSpacing: '0.1em', textTransform: 'uppercase',
                    borderColor: form.gstin && !gstinValid ? 'var(--accent-red)' : undefined,
                  }} />
                {form.gstin && !gstinValid && (
                  <p style={{ fontSize: 11, color: 'var(--accent-red)', marginTop: 4 }}>
                    Invalid GSTIN format. Should be 15 characters like 22AAAAA0000A1Z5
                  </p>
                )}
                {form.gstin && gstinValid && (
                  <p style={{ fontSize: 11, color: 'var(--accent-green)', marginTop: 4, display: 'flex', alignItems: 'center', gap: 4 }}>
                    <CheckCircle size={11} /> Valid GSTIN format
                  </p>
                )}
                <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>
                  Your GSTIN will appear on exported PDF reports for your CA
                </p>
              </Field>
            </div>
          </div>

          {/* Save */}
          {error && (
            <div style={{ marginBottom: 12, padding: '8px 12px', borderRadius: 6, background: 'rgba(255,77,77,0.1)', border: '1px solid rgba(255,77,77,0.2)', fontSize: 13, color: 'var(--accent-red)' }}>
              {error}
            </div>
          )}
          {saved && (
            <div style={{ marginBottom: 12, padding: '8px 12px', borderRadius: 6, background: 'rgba(0,212,170,0.1)', border: '1px solid rgba(0,212,170,0.2)', fontSize: 13, color: 'var(--accent-green)', display: 'flex', alignItems: 'center', gap: 6 }}>
              <CheckCircle size={14} /> Settings saved successfully!
            </div>
          )}

          <button id="save-settings" type="submit" className="btn-primary" disabled={saving || (form.gstin && !gstinValid)}>
            {saving ? <><span className="spinner" style={{ width: 14, height: 14 }} /> Saving...</> : <><Save size={15} /> Save Settings</>}
          </button>
        </form>

        {/* GST deadlines */}
        <div className="card" style={{ marginTop: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(245,166,35,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent-amber)' }}>
              <Bell size={18} />
            </div>
            <h2 style={{ fontFamily: 'Space Grotesk', fontSize: 16, fontWeight: 600 }}>GST Filing Deadlines</h2>
          </div>
          <div style={{ display: 'grid', gap: 10 }}>
            {[
              { form: 'GSTR-3B', desc: 'Monthly GST return — file ITC here', deadline: '20th of next month', critical: true },
              { form: 'GSTR-1', desc: 'Sales invoice details — outward supplies', deadline: '11th of next month', critical: false },
              { form: 'GSTR-2B', desc: 'Auto-drafted ITC statement from vendor filings', deadline: '14th of every month', critical: false },
            ].map(item => (
              <div key={item.form} style={{
                display: 'flex', alignItems: 'center', gap: 14, padding: '12px 14px', borderRadius: 8,
                background: item.critical ? 'rgba(245,166,35,0.06)' : 'var(--bg-elevated)',
                border: `1px solid ${item.critical ? 'rgba(245,166,35,0.2)' : 'var(--border)'}`,
              }}>
                <div style={{ minWidth: 70 }}>
                  <div style={{ fontFamily: 'JetBrains Mono', fontSize: 13, fontWeight: 600, color: item.critical ? 'var(--accent-amber)' : 'var(--text-primary)' }}>{item.form}</div>
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{item.desc}</div>
                </div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>{item.deadline}</div>
              </div>
            ))}
          </div>
          <p style={{ marginTop: 12, fontSize: 12, color: 'var(--text-muted)' }}>
            * Deadlines may be extended by the GSTN portal. Always check the official GST portal for the latest dates.
          </p>
        </div>

        {/* V2 — Email Reminders toggle */}
        <div className="card" style={{ marginTop: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(0,212,170,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent-green)' }}>
              <Bell size={18} />
            </div>
            <h2 style={{ fontFamily: 'Space Grotesk', fontSize: 16, fontWeight: 600 }}>🔔 Email Reminders</h2>
          </div>

          <p style={{ color: 'var(--text-secondary)', fontSize: 13, marginBottom: 20 }}>
            Get an email reminder before GST filing deadlines when you have claimable ITC to recover.
          </p>

          {/* Toggle row */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            padding: '14px 16px', borderRadius: 8, background: 'var(--bg-elevated)', border: '1px solid var(--border)' }}>
            <div>
              <div style={{ fontWeight: 600, fontSize: 14, color: 'var(--text-primary)', marginBottom: 3 }}>Deadline Reminders</div>
              <div style={{ color: 'var(--text-secondary)', fontSize: 12 }}>
                Sent at 9 AM on the 13th (7 days before) and 18th (2 days before) of every month
              </div>
            </div>

            {/* iOS-style toggle switch */}
            <label style={{ position: 'relative', display: 'inline-block', width: 44, height: 24, flexShrink: 0, cursor: 'pointer' }}>
              <input
                type="checkbox"
                id="email-reminders-toggle"
                checked={emailReminders}
                onChange={e => handleToggleReminders(e.target.checked)}
                disabled={savingReminders}
                style={{ opacity: 0, width: 0, height: 0 }}
              />
              <span style={{
                position: 'absolute', cursor: 'pointer', inset: 0,
                background: emailReminders ? 'var(--accent-green)' : 'var(--border)',
                borderRadius: 24,
                transition: 'background 0.2s ease',
                opacity: savingReminders ? 0.6 : 1,
              }}>
                <span style={{
                  position: 'absolute',
                  left: emailReminders ? 22 : 2,
                  top: 2,
                  width: 20, height: 20,
                  borderRadius: '50%',
                  background: '#fff',
                  transition: 'left 0.2s ease',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
                }} />
              </span>
            </label>
          </div>

          {/* Destination email display */}
          <div style={{ marginTop: 12, fontSize: 12, color: 'var(--text-secondary)' }}>
            {emailReminders ? (
              <span>
                ✅ Reminders will be sent to{' '}
                <strong style={{ color: 'var(--text-primary)', fontFamily: 'JetBrains Mono', fontSize: 11 }}>
                  {user?.email}
                </strong>
              </span>
            ) : (
              <span style={{ color: 'var(--text-muted)' }}>🔕 Email reminders are turned off.</span>
            )}
          </div>
        </div>

        {/* Account danger zone */}
        <div className="card" style={{ marginTop: 20, border: '1px solid rgba(255,77,77,0.2)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
            <Shield size={18} style={{ color: 'var(--accent-red)' }} />
            <h2 style={{ fontFamily: 'Space Grotesk', fontSize: 16, fontWeight: 600 }}>Account</h2>
          </div>
          <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 14 }}>
            Your data is stored securely. We never share your financial data with third parties.
          </p>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <div style={{ padding: '8px 12px', borderRadius: 6, background: 'var(--bg-elevated)', border: '1px solid var(--border)', fontSize: 12 }}>
              <span style={{ color: 'var(--text-muted)' }}>Member since: </span>
              <span style={{ color: 'var(--text-secondary)' }}>{user?.createdAt ? new Date(user.createdAt).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' }) : 'Today'}</span>
            </div>
          </div>
        </div>

        {/* About */}
        <div style={{ marginTop: 20, padding: '16px', borderRadius: 8, background: 'var(--bg-card)', border: '1px solid var(--border)', fontSize: 12, color: 'var(--text-muted)', textAlign: 'center' }}>
          <strong style={{ color: 'var(--text-secondary)' }}>ITClaim v1.0</strong> · Built for Indian freelancers & SMEs · 
          Not a registered CA firm · Always consult a qualified CA for complex tax matters
        </div>
      </main>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <div>
      <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</label>
      {children}
    </div>
  );
}
