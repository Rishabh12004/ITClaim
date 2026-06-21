import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Eye, EyeOff, ArrowRight } from 'lucide-react';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await login(form.email, form.password);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid email or password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'var(--bg-primary)', padding: 24,
      backgroundImage: 'radial-gradient(ellipse at 50% 0%, rgba(0,212,170,0.08) 0%, transparent 60%)',
    }}>
      <div style={{ width: '100%', maxWidth: 420 }}>
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
            <h1 style={{ fontFamily: 'Space Grotesk', fontSize: 26, fontWeight: 700, marginBottom: 6 }}>Welcome back</h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>Sign in to claim your GST credits</p>
          </div>
        </div>

        {/* Demo credentials hint */}
        <div style={{ padding: '10px 14px', borderRadius: 8, marginBottom: 20, background: 'rgba(0,212,170,0.07)', border: '1px solid rgba(0,212,170,0.2)', fontSize: 12, color: 'var(--text-secondary)' }}>
          <strong style={{ color: 'var(--accent-green)' }}>Demo:</strong> demo@itclaim.in / Demo@1234
        </div>

        <div className="card">
          <form onSubmit={handleSubmit} style={{ display: 'grid', gap: 16 }}>
            <div>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Email</label>
              <input id="login-email" name="email" type="email" value={form.email} onChange={handleChange}
                placeholder="you@example.com" className="input-field" required autoFocus />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Password</label>
              <div style={{ position: 'relative' }}>
                <input id="login-password" name="password" type={showPass ? 'text' : 'password'} value={form.password} onChange={handleChange}
                  placeholder="••••••••" className="input-field" required style={{ paddingRight: 40 }} />
                <button type="button" onClick={() => setShowPass(!showPass)}
                  style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
                  {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {error && (
              <div style={{ padding: '8px 12px', borderRadius: 6, background: 'rgba(255,77,77,0.1)', border: '1px solid rgba(255,77,77,0.2)', fontSize: 13, color: 'var(--accent-red)' }}>
                {error}
              </div>
            )}

            <button id="login-submit" type="submit" className="btn-primary" style={{ width: '100%', justifyContent: 'center', padding: '12px', marginTop: 4 }} disabled={loading}>
              {loading ? <span className="spinner" style={{ width: 16, height: 16 }} /> : <>Sign In <ArrowRight size={16} /></>}
            </button>
          </form>
        </div>

        <p style={{ textAlign: 'center', marginTop: 20, fontSize: 13, color: 'var(--text-secondary)' }}>
          Don't have an account?{' '}
          <Link to="/register" style={{ color: 'var(--accent-green)', fontWeight: 600, textDecoration: 'none' }}>
            Create one free →
          </Link>
        </p>
      </div>
    </div>
  );
}
