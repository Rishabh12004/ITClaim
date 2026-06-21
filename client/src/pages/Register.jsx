import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Eye, EyeOff, ArrowRight, CheckCircle } from 'lucide-react';

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: '', email: '', password: '', businessName: '', gstin: ''
  });
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      await register(form.name, form.email, form.password, form.businessName, form.gstin);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const gstinValid = form.gstin.length === 0 || /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/.test(form.gstin);

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'var(--bg-primary)', padding: 24,
      backgroundImage: 'radial-gradient(ellipse at 50% 0%, rgba(0,212,170,0.07) 0%, transparent 55%)',
    }}>
      <div style={{ width: '100%', maxWidth: 460 }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <Link to="/" style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 42, height: 42, borderRadius: 12, background: 'var(--accent-green)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontFamily: 'Space Grotesk', fontWeight: 700, fontSize: 18, color: '#0F1117'
            }}>IT</div>
            <span style={{ fontFamily: 'Space Grotesk', fontWeight: 700, fontSize: 24, color: 'var(--text-primary)' }}>ITClaim</span>
          </Link>
          <div style={{ marginTop: 24 }}>
            <h1 style={{ fontFamily: 'Space Grotesk', fontSize: 26, fontWeight: 700, marginBottom: 6 }}>Create your account</h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>Start reclaiming your GST credits for free</p>
          </div>
        </div>

        {/* Benefits */}
        <div style={{ display: 'flex', gap: 16, marginBottom: 20, flexWrap: 'wrap', justifyContent: 'center' }}>
          {['Free forever', 'No CA needed', 'Takes 2 minutes'].map(b => (
            <div key={b} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--accent-green)' }}>
              <CheckCircle size={13} />
              {b}
            </div>
          ))}
        </div>

        <div className="card">
          <form onSubmit={handleSubmit} style={{ display: 'grid', gap: 14 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Full Name *</label>
                <input id="reg-name" name="name" value={form.name} onChange={handleChange}
                  placeholder="Priya Sharma" className="input-field" required autoFocus />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Business Name</label>
                <input id="reg-business" name="businessName" value={form.businessName} onChange={handleChange}
                  placeholder="Priya Designs" className="input-field" />
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Email *</label>
              <input id="reg-email" name="email" type="email" value={form.email} onChange={handleChange}
                placeholder="priya@example.com" className="input-field" required />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Password *</label>
              <div style={{ position: 'relative' }}>
                <input id="reg-password" name="password" type={showPass ? 'text' : 'password'} value={form.password} onChange={handleChange}
                  placeholder="At least 6 characters" className="input-field" required style={{ paddingRight: 40 }} />
                <button type="button" onClick={() => setShowPass(!showPass)}
                  style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
                  {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                GSTIN <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>(optional)</span>
              </label>
              <input id="reg-gstin" name="gstin" value={form.gstin} onChange={handleChange}
                placeholder="22AAAAA0000A1Z5" className="input-field"
                style={{ fontFamily: 'JetBrains Mono', letterSpacing: '0.05em', borderColor: form.gstin && !gstinValid ? 'var(--accent-red)' : undefined }} />
              {form.gstin && !gstinValid && (
                <p style={{ fontSize: 11, color: 'var(--accent-red)', marginTop: 4 }}>Invalid GSTIN format. Should be 15 characters like 22AAAAA0000A1Z5</p>
              )}
            </div>

            {error && (
              <div style={{ padding: '8px 12px', borderRadius: 6, background: 'rgba(255,77,77,0.1)', border: '1px solid rgba(255,77,77,0.2)', fontSize: 13, color: 'var(--accent-red)' }}>
                {error}
              </div>
            )}

            <button id="register-submit" type="submit" className="btn-primary" style={{ width: '100%', justifyContent: 'center', padding: '12px', marginTop: 4 }} disabled={loading || (form.gstin && !gstinValid)}>
              {loading ? <span className="spinner" style={{ width: 16, height: 16 }} /> : <>Create Account <ArrowRight size={16} /></>}
            </button>
          </form>
        </div>

        <p style={{ textAlign: 'center', marginTop: 20, fontSize: 13, color: 'var(--text-secondary)' }}>
          Already have an account?{' '}
          <Link to="/login" style={{ color: 'var(--accent-green)', fontWeight: 600, textDecoration: 'none' }}>
            Sign in →
          </Link>
        </p>

        <p style={{ textAlign: 'center', marginTop: 12, fontSize: 11, color: 'var(--text-muted)' }}>
          By registering, you agree to our Terms of Service. We never share your data.
        </p>
      </div>
    </div>
  );
}
