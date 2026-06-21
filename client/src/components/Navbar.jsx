import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LayoutDashboard, Receipt, ScanLine, BarChart2, Settings, LogOut, Menu, X } from 'lucide-react';
import { useState } from 'react';

const navItems = [
  { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/expenses', label: 'Expenses', icon: Receipt },
  { path: '/scanner', label: 'Scanner', icon: ScanLine },
  { path: '/report', label: 'Reports', icon: BarChart2 },
  { path: '/settings', label: 'Settings', icon: Settings },
];

export default function Navbar() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col fixed left-0 top-0 bottom-0 w-60 z-40"
        style={{ background: 'var(--bg-card)', borderRight: '1px solid var(--border)' }}>
        {/* Logo */}
        <div className="p-6 pb-4">
          <Link to="/dashboard" style={{ textDecoration: 'none' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{
                width: 36, height: 36, borderRadius: 10,
                background: 'var(--accent-green)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontFamily: 'Space Grotesk', fontWeight: 700, fontSize: 16, color: '#0F1117'
              }}>IT</div>
              <span style={{ fontFamily: 'Space Grotesk', fontWeight: 700, fontSize: 20, color: 'var(--text-primary)' }}>ITClaim</span>
            </div>
          </Link>
        </div>

        {/* Nav items */}
        <nav style={{ flex: 1, padding: '0 12px' }}>
          {navItems.map(({ path, label, icon: Icon }) => {
            const active = location.pathname === path;
            return (
              <Link key={path} to={path} style={{ textDecoration: 'none', display: 'block', marginBottom: 4 }}>
                <div style={{
                  display: 'flex', alignItems: 'center', gap: 12,
                  padding: '10px 14px', borderRadius: 8,
                  background: active ? 'rgba(0, 212, 170, 0.1)' : 'transparent',
                  color: active ? 'var(--accent-green)' : 'var(--text-secondary)',
                  fontFamily: 'Inter', fontWeight: active ? 600 : 500, fontSize: 14,
                  transition: 'all 0.15s ease',
                  border: active ? '1px solid rgba(0,212,170,0.2)' : '1px solid transparent',
                  cursor: 'pointer',
                }}>
                  <Icon size={18} />
                  {label}
                </div>
              </Link>
            );
          })}
        </nav>

        {/* User info + logout */}
        <div style={{ padding: 16, borderTop: '1px solid var(--border)' }}>
          <div style={{ marginBottom: 12 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>{user?.name}</div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>{user?.businessName || user?.email}</div>
            {user?.gstin && (
              <div style={{ fontFamily: 'JetBrains Mono', fontSize: 10, color: 'var(--text-muted)', marginTop: 4, letterSpacing: '0.05em' }}>
                GSTIN: {user.gstin}
              </div>
            )}
          </div>
          <button onClick={handleLogout} className="btn-ghost" style={{ width: '100%', justifyContent: 'flex-start', color: 'var(--accent-red)', fontSize: 13 }}>
            <LogOut size={15} />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Mobile Header */}
      <header className="md:hidden fixed top-0 left-0 right-0 z-40 flex items-center justify-between px-4 py-3"
        style={{ background: 'var(--bg-card)', borderBottom: '1px solid var(--border)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{
            width: 30, height: 30, borderRadius: 8,
            background: 'var(--accent-green)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontFamily: 'Space Grotesk', fontWeight: 700, fontSize: 13, color: '#0F1117'
          }}>IT</div>
          <span style={{ fontFamily: 'Space Grotesk', fontWeight: 700, fontSize: 18, color: 'var(--text-primary)' }}>ITClaim</span>
        </div>
        <button onClick={() => setMobileOpen(!mobileOpen)} className="btn-ghost" style={{ padding: 8 }}>
          {mobileOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </header>

      {/* Mobile Nav Drawer */}
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-50" onClick={() => setMobileOpen(false)}
          style={{ background: 'rgba(0,0,0,0.7)' }}>
          <div style={{
            position: 'absolute', right: 0, top: 0, bottom: 0, width: 240,
            background: 'var(--bg-card)', borderLeft: '1px solid var(--border)',
            padding: 20, paddingTop: 60,
          }} onClick={e => e.stopPropagation()}>
            {navItems.map(({ path, label, icon: Icon }) => {
              const active = location.pathname === path;
              return (
                <Link key={path} to={path} style={{ textDecoration: 'none', display: 'block', marginBottom: 4 }}
                  onClick={() => setMobileOpen(false)}>
                  <div style={{
                    display: 'flex', alignItems: 'center', gap: 12,
                    padding: '10px 14px', borderRadius: 8,
                    background: active ? 'rgba(0, 212, 170, 0.1)' : 'transparent',
                    color: active ? 'var(--accent-green)' : 'var(--text-secondary)',
                    fontFamily: 'Inter', fontWeight: active ? 600 : 500, fontSize: 14,
                  }}>
                    <Icon size={18} />
                    {label}
                  </div>
                </Link>
              );
            })}
            <button onClick={handleLogout} className="btn-ghost"
              style={{ width: '100%', justifyContent: 'flex-start', color: 'var(--accent-red)', fontSize: 13, marginTop: 16 }}>
              <LogOut size={15} />
              Sign Out
            </button>
          </div>
        </div>
      )}

      {/* Mobile Bottom Nav */}
      <nav className="md:hidden bottom-nav">
        {navItems.slice(0, 5).map(({ path, label, icon: Icon }) => {
          const active = location.pathname === path;
          return (
            <Link key={path} to={path} className={`bottom-nav-item ${active ? 'active' : ''}`}>
              <Icon size={20} />
              <span>{label}</span>
            </Link>
          );
        })}
      </nav>
    </>
  );
}
