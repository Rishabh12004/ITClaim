const Tesseract = require('tesseract.js');

async function testOCR() {
  const { data: { text } } = await Tesseract.recognize('/Users/rishabhhirwe/Desktop/invoice.webp', 'eng');
  console.log("--- OCR TEXT ---");
  console.log(text);
  console.log("----------------");

  let amount = '', gstAmount = '';
  const amountPatterns = [
    /(?:^|\s)(?:total|amount|grand total|bill amount)\b[^\d]{0,15}?([0-9,]+(?:\.\d{2})?)(?!\s*[\d%])/i,
    /(?:₹|rs\.?|inr|¥)[^\d]*([0-9,]+(?:\.\d{2})?)(?!\s*[\d%])/i,
  ];
  const gstPatterns = [
    /(?:^|\s)(?:gst|igst|cgst|sgst|tax)\b[^\d]{0,15}?([0-9,]+(?:\.\d{2})?)(?!\s*[\d%])/i,
    /(?:18%|gst @\s*18)[^\d]*([0-9,]+(?:\.\d{2})?)(?!\s*[\d%])/i,
  ];
  for (const p of amountPatterns) { const m = text.match(p); if (m) { amount    = m[1].replace(/,/g, ''); break; } }
  for (const p of gstPatterns)    { const m = text.match(p); if (m) { gstAmount = m[1].replace(/,/g, ''); break; } }

  console.log("Amount:", amount);
  console.log("GST:", gstAmount);
}

testOCR();
