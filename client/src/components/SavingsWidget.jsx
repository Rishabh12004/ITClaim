import { useEffect, useState, useRef } from 'react';
import { TrendingUp, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

function useCountUp(target, duration = 1500) {
  const [count, setCount] = useState(0);
  const startTimeRef = useRef(null);
  const frameRef = useRef(null);
  const prevTarget = useRef(0);

  useEffect(() => {
    if (!target && target !== 0) return;
    const startVal = prevTarget.current;
    prevTarget.current = target;
    startTimeRef.current = null;

    const animate = (timestamp) => {
      if (!startTimeRef.current) startTimeRef.current = timestamp;
      const progress = Math.min((timestamp - startTimeRef.current) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(Math.round(startVal + eased * (target - startVal)));
      if (progress < 1) frameRef.current = requestAnimationFrame(animate);
    };
    frameRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frameRef.current);
  }, [target, duration]);

  return count;
}

export default function SavingsWidget({ claimable = 0, notClaimable = 0, review = 0 }) {
  const animatedValue = useCountUp(claimable);
  const total = claimable + notClaimable + review;

  return (
    <div className="card-hero" style={{ padding: 32, position: 'relative', overflow: 'hidden', marginBottom: 24 }}>
      {/* Radial glow */}
      <div style={{
        position: 'absolute', top: -60, right: -60, width: 250, height: 250,
        background: 'radial-gradient(circle, rgba(0,212,170,0.1) 0%, transparent 70%)',
        pointerEvents: 'none',
      }} />
      <div style={{
        position: 'absolute', bottom: -40, left: -40, width: 180, height: 180,
        background: 'radial-gradient(circle, rgba(0,212,170,0.05) 0%, transparent 70%)',
        pointerEvents: 'none',
      }} />

      <div style={{ position: 'relative', zIndex: 1 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
          <TrendingUp size={16} style={{ color: 'var(--accent-green)' }} />
          <span style={{
            fontSize: 11, fontWeight: 700, letterSpacing: '0.1em',
            textTransform: 'uppercase', color: 'var(--text-secondary)'
          }}>This Month You Can Claim</span>
        </div>

        <div className="animate-glow-pulse" style={{
          fontFamily: 'Space Grotesk', fontSize: 56, fontWeight: 700,
          color: 'var(--accent-green)', lineHeight: 1, marginBottom: 12,
          letterSpacing: '-0.02em',
        }}>
          ₹{animatedValue.toLocaleString('en-IN')}
        </div>

        <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 24 }}>
          ← that's ₹{claimable.toLocaleString('en-IN')} you don't have to pay the government
        </p>

        {/* Breakdown */}
        <div style={{ display: 'flex', gap: 32, marginBottom: 24, flexWrap: 'wrap' }}>
          <Stat label="Claimable" value={claimable} color="var(--accent-green)" />
          <div style={{ width: 1, background: 'var(--border)', alignSelf: 'stretch' }} />
          <Stat label="Not Claimable" value={notClaimable} color="var(--accent-red)" />
          <div style={{ width: 1, background: 'var(--border)', alignSelf: 'stretch' }} />
          <Stat label="Needs Review" value={review} color="var(--accent-amber)" />
        </div>

        {/* Progress */}
        {total > 0 && (
          <div style={{ marginBottom: 24 }}>
            <div style={{ height: 6, borderRadius: 3, background: 'var(--border)', overflow: 'hidden', display: 'flex', gap: 1 }}>
              <div style={{ width: `${(claimable / total) * 100}%`, background: 'var(--accent-green)', transition: 'width 1s ease' }} />
              <div style={{ width: `${(review / total) * 100}%`, background: 'var(--accent-amber)', transition: 'width 1s ease' }} />
              <div style={{ width: `${(notClaimable / total) * 100}%`, background: 'rgba(255,77,77,0.5)', transition: 'width 1s ease' }} />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6, fontSize: 11, color: 'var(--text-muted)' }}>
              <span>{Math.round((claimable / total) * 100)}% confirmed claimable</span>
              <span>{Math.round(((claimable + review) / total) * 100)}% potential</span>
            </div>
          </div>
        )}

        <Link to="/report" style={{ textDecoration: 'none' }}>
          <button className="btn-primary">
            View Full Breakdown <ArrowRight size={15} />
          </button>
        </Link>
      </div>
    </div>
  );
}

function Stat({ label, value, color }) {
  return (
    <div>
      <div style={{ fontFamily: 'JetBrains Mono', fontSize: 20, fontWeight: 600, color }}>
        ₹{Number(value).toLocaleString('en-IN')}
      </div>
      <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2, fontWeight: 500 }}>{label}</div>
    </div>
  );
}
