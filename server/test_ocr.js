const text = `Kantech Solutions Private Limited Invoice date Vijaya Traders Private Limited
Ground Floor, Building 2A, 23 & 24 30/06/2017 51, Penthouse 01, 6th Floor, Rich
AMR Tech Park Internal Rd, Hongasandra Homes Apartment, Richmond Road
Bengaluru, Karnataka 560068 Roemer Bengaluru, Karnataka 560025
GSTIN 04ARCPD987431Z5 GSTIN 04ARCPD987431Z5
Invoice number
1
ws (ww | ow [owes] Ow | wee]
Shampoo 34011111 10,000 10.00 | CGST 14% + SGST 14% 1,00,000.00
Soap 34011110 5,000 5.00 CGST 9% + SGST 9% 25,000.00
Sub-total | ¥1,25,000.00
CGST % 16,250.00
SGST % 16,250.00
Total | ¥1,57,500.00
Total in words
Rupees One Lakh Fifty Seven Thousand Five Hundred`;

  const gstPatterns = [
    /(?:^|\s)(?:gst|igst|cgst|sgst|tax)\b[^\d]{0,15}?([0-9,]+(?:\.\d{2})?)(?!\s*[\d%])/i,
    /(?:18%|gst @\s*18)[^\d]*([0-9,]+(?:\.\d{2})?)(?!\s*[\d%])/i,
  ];
  for (const p of gstPatterns)    { const m = text.match(p); if (m) { console.log("Match:", m[0], "Group 1:", m[1]); break; } }
