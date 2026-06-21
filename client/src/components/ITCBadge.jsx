export default function ITCBadge({ status, confidence, showConfidence = false }) {
  if (status === 'claimable') {
    return (
      <span className="badge-claimable">
        ✓ Claimable
        {showConfidence && confidence && (
          <span style={{ opacity: 0.7, fontSize: 10 }}>({confidence})</span>
        )}
      </span>
    );
  }
  if (status === 'not_claimable') {
    return (
      <span className="badge-not-claimable">
        ✗ Not Claimable
        {showConfidence && confidence && (
          <span style={{ opacity: 0.7, fontSize: 10 }}>({confidence})</span>
        )}
      </span>
    );
  }
  return (
    <span className="badge-review">
      ⚠ Review
      {showConfidence && confidence && (
        <span style={{ opacity: 0.7, fontSize: 10 }}>({confidence})</span>
      )}
    </span>
  );
}
