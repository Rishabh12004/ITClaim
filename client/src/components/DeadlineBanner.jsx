import { getGSTFilingDeadline } from '../utils/itcRules';
import { AlertTriangle, Clock } from 'lucide-react';

export default function DeadlineBanner() {
  const { daysLeft, formattedDate, filingPeriod } = getGSTFilingDeadline();
  
  if (daysLeft > 14) return null;

  const urgent = daysLeft <= 7;
  const color = urgent ? 'var(--accent-red)' : 'var(--accent-amber)';
  const bg = urgent ? 'rgba(255, 77, 77, 0.08)' : 'rgba(245, 166, 35, 0.08)';
  const border = urgent ? 'rgba(255, 77, 77, 0.25)' : 'rgba(245, 166, 35, 0.25)';

  return (
    <div style={{
      background: bg,
      border: `1px solid ${border}`,
      borderRadius: 10,
      padding: '12px 16px',
      display: 'flex',
      alignItems: 'center',
      gap: 12,
      marginBottom: 24,
      animation: 'fadeInUp 0.4s ease-out',
      flexWrap: 'wrap',
    }}>
      {urgent ? (
        <AlertTriangle size={18} style={{ color, flexShrink: 0 }} />
      ) : (
        <Clock size={18} style={{ color, flexShrink: 0 }} />
      )}
      <div style={{ flex: 1, minWidth: 200 }}>
        <span style={{ color, fontWeight: 600, fontSize: 13, fontFamily: 'Inter' }}>
          {urgent ? '🚨 Urgent: ' : '⏰ Reminder: '}
          GST filing for {filingPeriod} is due in <strong>{daysLeft} day{daysLeft !== 1 ? 's' : ''}</strong>
        </span>
        <span style={{ color: 'var(--text-secondary)', fontSize: 12, marginLeft: 8 }}>
          Deadline: {formattedDate} — file GSTR-3B to claim your ITC
        </span>
      </div>
      <a href="https://www.gst.gov.in" target="_blank" rel="noopener noreferrer"
        style={{ color, fontSize: 12, fontWeight: 600, textDecoration: 'none', whiteSpace: 'nowrap',
          padding: '4px 10px', border: `1px solid ${border}`, borderRadius: 6 }}>
        File Now →
      </a>
    </div>
  );
}
