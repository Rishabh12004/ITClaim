const text = `
Sub-total | ¥1,25,000.00
CGST % 16,250.00
SGST % 16,250.00
Total | ¥1,57,500.00
`;

  let amount = '', gstAmount = '';
  const amountPatterns = [
    /(?:^|\s)(?:total|amount|grand total|bill amount)[^\d]{0,15}?([0-9,]+(?:\.\d{2})?)/i,
    /(?:₹|rs\.?|inr|¥)[^\d]*([0-9,]+(?:\.\d{2})?)/i,
  ];
  const gstPatterns = [
    /(?:^|\s)(?:gst|igst|cgst\s*\+\s*sgst|tax)[^\d]{0,15}?([0-9,]+(?:\.\d{2})?)/i,
    /(?:18%|gst @\s*18)[^\d]*([0-9,]+(?:\.\d{2})?)/i,
  ];
  for (const p of amountPatterns) { const m = text.match(p); if (m) { amount    = m[1].replace(/,/g, ''); break; } }
  for (const p of gstPatterns)    { const m = text.match(p); if (m) { gstAmount = m[1].replace(/,/g, ''); break; } }

console.log("Amount:", amount);
console.log("GST:", gstAmount);
