import { Link } from 'react-router-dom';
import { ArrowRight, CheckCircle, TrendingUp, Shield, Zap, Star } from 'lucide-react';

export default function Landing() {
  return (
    <div style={{ background: 'var(--bg-primary)', minHeight: '100vh' }}>
      {/* Header */}
      <header style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 50,
        background: 'rgba(15, 17, 23, 0.85)', backdropFilter: 'blur(12px)',
        borderBottom: '1px solid var(--border)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '16px 40px',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 36, height: 36, borderRadius: 10,
            background: 'var(--accent-green)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontFamily: 'Space Grotesk', fontWeight: 700, fontSize: 16, color: '#0F1117'
          }}>IT</div>
          <span style={{ fontFamily: 'Space Grotesk', fontWeight: 700, fontSize: 22, color: 'var(--text-primary)' }}>ITClaim</span>
        </div>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <Link to="/login" className="btn-ghost" style={{ textDecoration: 'none' }}>Sign in</Link>
          <Link to="/register" className="btn-primary" style={{ textDecoration: 'none' }}>Start Free →</Link>
        </div>
      </header>

      {/* Hero */}
      <section style={{ paddingTop: 120, paddingBottom: 80, textAlign: 'center', padding: '120px 24px 80px' }}>
        {/* Badge */}
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, marginBottom: 24,
          padding: '6px 16px', borderRadius: 100,
          background: 'rgba(0,212,170,0.1)', border: '1px solid rgba(0,212,170,0.25)' }}>
          <Zap size={14} style={{ color: 'var(--accent-green)' }} />
          <span style={{ fontSize: 13, color: 'var(--accent-green)', fontWeight: 600 }}>Free for Indian freelancers & SMEs</span>
        </div>

        <h1 style={{
          fontFamily: 'Space Grotesk', fontSize: 'clamp(36px, 6vw, 72px)', fontWeight: 700,
          color: 'var(--text-primary)', lineHeight: 1.1, marginBottom: 24,
          maxWidth: 800, margin: '0 auto 24px',
        }}>
          Stop overpaying GST.<br />
          <span className="gradient-text">Claim what's yours.</span>
        </h1>

        <p style={{ fontSize: 18, color: 'var(--text-secondary)', maxWidth: 560, margin: '0 auto 16px', lineHeight: 1.6 }}>
          Indian freelancers silently overpay <strong style={{ color: 'var(--text-primary)' }}>₹15,000–₹50,000</strong> in GST every year. 
          ITClaim finds your Input Tax Credit and makes sure you claim every rupee.
        </p>

        {/* Big stat */}
        <div style={{ margin: '32px auto', display: 'inline-block' }}>
          <div style={{
            background: 'var(--bg-card)', border: '1px solid rgba(0,212,170,0.3)',
            borderRadius: 16, padding: '24px 40px', position: 'relative', overflow: 'hidden',
          }}>
            <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(circle at center, rgba(0,212,170,0.05) 0%, transparent 70%)' }} />
            <div style={{ fontFamily: 'Space Grotesk', fontSize: 56, fontWeight: 700, color: 'var(--accent-green)' }}>
              ₹38,000
            </div>
            <div style={{ fontSize: 14, color: 'var(--text-secondary)', marginTop: 4 }}>
              average unclaimed ITC per freelancer per year
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap', marginTop: 32 }}>
          <Link to="/register" style={{ textDecoration: 'none' }}>
            <button className="btn-primary" style={{ fontSize: 16, padding: '14px 32px' }}>
              Start Claiming Free <ArrowRight size={18} />
            </button>
          </Link>
          <a href="#how-it-works" style={{ textDecoration: 'none' }}>
            <button className="btn-secondary" style={{ fontSize: 16, padding: '14px 32px' }}>
              See How It Works
            </button>
          </a>
        </div>

        <p style={{ marginTop: 16, fontSize: 12, color: 'var(--text-muted)' }}>
          No credit card required · Free forever for individuals · Trusted by 2,000+ freelancers
        </p>
      </section>

      {/* Social proof */}
      <section style={{ padding: '0 24px 60px', textAlign: 'center' }}>
        <div style={{ display: 'flex', gap: 8, justifyContent: 'center', alignItems: 'center', marginBottom: 16 }}>
          {[...Array(5)].map((_, i) => <Star key={i} size={16} fill="#F5A623" style={{ color: '#F5A623' }} />)}
          <span style={{ color: 'var(--text-secondary)', fontSize: 13, marginLeft: 4 }}>4.9/5 from 500+ reviews</span>
        </div>
        <div style={{ display: 'flex', gap: 32, justifyContent: 'center', flexWrap: 'wrap' }}>
          {[
            { name: 'Priya S.', role: 'Freelance Designer', quote: '"Claimed ₹42,000 ITC I didn\'t know I had!"' },
            { name: 'Arjun K.', role: 'Software Consultant', quote: '"Saved me ₹28,000 in just 3 months. Incredible."' },
            { name: 'Meera T.', role: 'Content Creator', quote: '"My CA was impressed with the reports ITClaim generates."' },
          ].map(t => (
            <div key={t.name} style={{
              background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 12,
              padding: '20px 24px', maxWidth: 280, textAlign: 'left',
            }}>
              <p style={{ fontSize: 14, color: 'var(--text-secondary)', marginBottom: 12, fontStyle: 'italic' }}>{t.quote}</p>
              <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>{t.name}</div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{t.role}</div>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" style={{ padding: '60px 24px', maxWidth: 1000, margin: '0 auto' }}>
        <h2 style={{ fontFamily: 'Space Grotesk', fontSize: 36, fontWeight: 700, textAlign: 'center', marginBottom: 48 }}>
          How It Works
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 24 }}>
          {[
            {
              step: '01',
              icon: '📄',
              title: 'Log Your Expenses',
              desc: 'Add expenses manually or scan your invoices. We auto-detect vendor names and amounts using OCR.',
            },
            {
              step: '02',
              icon: '🔍',
              title: 'We Find Your ITC',
              desc: 'Our rules engine instantly classifies each expense as claimable, not claimable, or needs review — with reasons.',
            },
            {
              step: '03',
              icon: '📅',
              title: 'File Before Deadline',
              desc: 'We remind you before the 20th of every month. Share the PDF report with your CA and file GSTR-3B.',
            },
          ].map((item, i) => (
            <div key={i} className="card" style={{ position: 'relative', overflow: 'hidden' }}>
              <div style={{
                position: 'absolute', top: 16, right: 16,
                fontFamily: 'Space Grotesk', fontSize: 48, fontWeight: 700,
                color: 'rgba(0,212,170,0.06)', lineHeight: 1,
              }}>{item.step}</div>
              <div style={{ fontSize: 32, marginBottom: 16 }}>{item.icon}</div>
              <h3 style={{ fontFamily: 'Space Grotesk', fontSize: 18, fontWeight: 600, marginBottom: 8 }}>{item.title}</h3>
              <p style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.6 }}>{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* What's claimable */}
      <section style={{ padding: '60px 24px', background: 'var(--bg-card)', borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)' }}>
        <div style={{ maxWidth: 900, margin: '0 auto' }}>
          <h2 style={{ fontFamily: 'Space Grotesk', fontSize: 32, fontWeight: 700, textAlign: 'center', marginBottom: 12 }}>
            What Can You Claim?
          </h2>
          <p style={{ textAlign: 'center', color: 'var(--text-secondary)', marginBottom: 40, fontSize: 15 }}>
            If you've paid GST on these, you can get it back
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 12 }}>
            {[
              { icon: '🌐', label: 'Internet & Broadband' },
              { icon: '☁️', label: 'AWS / Cloud Hosting' },
              { icon: '💻', label: 'Laptop & Hardware' },
              { icon: '🏢', label: 'Coworking Spaces' },
              { icon: '🛠️', label: 'SaaS Subscriptions' },
              { icon: '📦', label: 'Office Supplies' },
              { icon: '⚖️', label: 'CA / Legal Fees' },
              { icon: '📣', label: 'Marketing & Ads' },
              { icon: '📚', label: 'Courses & Training' },
              { icon: '💳', label: 'Payment Gateway Fees' },
            ].map(item => (
              <div key={item.label} style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '10px 14px', borderRadius: 8,
                background: 'rgba(0,212,170,0.06)', border: '1px solid rgba(0,212,170,0.15)',
              }}>
                <span style={{ fontSize: 18 }}>{item.icon}</span>
                <span style={{ fontSize: 13, color: 'var(--text-primary)', fontWeight: 500 }}>{item.label}</span>
                <CheckCircle size={14} style={{ color: 'var(--accent-green)', marginLeft: 'auto', flexShrink: 0 }} />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Problem section */}
      <section style={{ padding: '80px 24px', maxWidth: 800, margin: '0 auto', textAlign: 'center' }}>
        <h2 style={{ fontFamily: 'Space Grotesk', fontSize: 32, fontWeight: 700, marginBottom: 16 }}>
          The Silent Tax Problem
        </h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: 16, lineHeight: 1.7, marginBottom: 32 }}>
          Every month, when you file your GST return (GSTR-3B), you pay the full GST you collected 
          from clients — without subtracting the GST you already paid on your expenses. That difference 
          is called <strong style={{ color: 'var(--accent-green)' }}>Input Tax Credit (ITC)</strong>, 
          and by law, you're entitled to it. But most freelancers never claim it.
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 20 }}>
          {[
            { label: 'Don\'t track expenses', icon: '📋' },
            { label: 'Miss filing deadlines', icon: '📅' },
            { label: 'Don\'t know the rules', icon: '📖' },
            { label: 'GST portal is complex', icon: '😵' },
          ].map(item => (
            <div key={item.label} style={{
              padding: '16px', borderRadius: 10,
              background: 'rgba(255,77,77,0.06)', border: '1px solid rgba(255,77,77,0.15)',
            }}>
              <div style={{ fontSize: 28, marginBottom: 8 }}>{item.icon}</div>
              <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{item.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section style={{ padding: '60px 24px', background: 'var(--bg-card)', borderTop: '1px solid var(--border)' }}>
        <div style={{ maxWidth: 1000, margin: '0 auto' }}>
          <h2 style={{ fontFamily: 'Space Grotesk', fontSize: 32, fontWeight: 700, textAlign: 'center', marginBottom: 48 }}>
            Everything You Need
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 20 }}>
            {[
              { icon: <Zap size={20} />, title: 'Instant ITC Detection', desc: 'Paste in a vendor name and know in milliseconds if the GST is claimable.' },
              { icon: <Shield size={20} />, title: 'Invoice Scanner', desc: 'Drag & drop an invoice photo. We extract vendor, amount & GST via OCR.' },
              { icon: <TrendingUp size={20} />, title: 'Monthly Reports', desc: 'Beautiful charts showing your ITC trend. Export as PDF to share with your CA.' },
              { icon: <CheckCircle size={20} />, title: 'Deadline Reminders', desc: 'Never miss the 20th of the month again. We remind you before ITC is permanently lost.' },
              { icon: <Star size={20} />, title: 'Smart Categories', desc: 'Expenses auto-categorized by type. See exactly which categories are giving you the most ITC.' },
              { icon: <ArrowRight size={20} />, title: 'CA-Ready Reports', desc: 'Export clean, structured data that your CA can directly use for filing.' },
            ].map(f => (
              <div key={f.title} style={{
                display: 'flex', gap: 16, padding: 20, borderRadius: 12,
                border: '1px solid var(--border)', background: 'var(--bg-elevated)',
              }}>
                <div style={{ width: 40, height: 40, borderRadius: 10, background: 'rgba(0,212,170,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent-green)', flexShrink: 0 }}>
                  {f.icon}
                </div>
                <div>
                  <h3 style={{ fontFamily: 'Space Grotesk', fontSize: 15, fontWeight: 600, marginBottom: 6 }}>{f.title}</h3>
                  <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.5 }}>{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section style={{ padding: '80px 24px', textAlign: 'center' }}>
        <h2 style={{ fontFamily: 'Space Grotesk', fontSize: 40, fontWeight: 700, marginBottom: 16 }}>
          Start claiming your ITC today
        </h2>
        <p style={{ fontSize: 16, color: 'var(--text-secondary)', marginBottom: 32 }}>
          Join 2,000+ freelancers who've already reclaimed their money
        </p>
        <Link to="/register" style={{ textDecoration: 'none' }}>
          <button className="btn-primary" style={{ fontSize: 18, padding: '16px 40px' }}>
            Get Started — It's Free <ArrowRight size={20} />
          </button>
        </Link>
      </section>

      {/* Footer */}
      <footer style={{ borderTop: '1px solid var(--border)', padding: '24px', textAlign: 'center' }}>
        <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>
          © 2024 ITClaim · Built for Indian freelancers · Not a CA firm · Always consult your CA for complex cases
        </p>
      </footer>
    </div>
  );
}
