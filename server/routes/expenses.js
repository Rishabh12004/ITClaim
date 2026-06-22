const express = require('express');
const router = express.Router();
const Expense = require('../models/Expense');
const auth = require('../middleware/authMiddleware');
const multer = require('multer');
const path = require('path');

// Multer config for invoice uploads
const storage = multer.diskStorage({
  destination: 'uploads/',
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `invoice-${req.user._id}-${Date.now()}${ext}`);
  },
});
const upload = multer({ storage, limits: { fileSize: 10 * 1024 * 1024 } });

// GET /api/expenses
router.get('/', auth, async (req, res) => {
  try {
    const { month, status, category, limit = 100 } = req.query;
    const query = { userId: req.user._id };

    if (month) query.filingMonth = month;
    if (status && status !== 'all') query.itcStatus = status;
    if (category && category !== 'all') query.category = category;

    const expenses = await Expense.find(query)
      .sort({ createdAt: -1 })
      .limit(parseInt(limit));

    res.json({ expenses });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to fetch expenses.' });
  }
});

// POST /api/expenses
router.post('/', auth, async (req, res) => {
  try {
    const {
      vendorName, description, amount, gstPaid, category,
      itcStatus, itcReason, confidence, invoiceDate,
      // V2 additions
      vendorGstin, vendorCompliant,
    } = req.body;

    if (!vendorName || amount === undefined || gstPaid === undefined) {
      return res.status(400).json({ message: 'Vendor name, amount, and GST paid are required.' });
    }

    const d = invoiceDate ? new Date(invoiceDate) : new Date();
    const filingMonth = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;

    const expense = await Expense.create({
      userId: req.user._id,
      vendorName,
      description,
      amount: parseFloat(amount),
      gstPaid: parseFloat(gstPaid),
      category: category || 'other',
      itcStatus: itcStatus || 'review',
      itcReason,
      confidence: confidence || 'low',
      invoiceDate: d,
      filingMonth,
      // V2 additions
      vendorGstin: vendorGstin || undefined,
      vendorCompliant: vendorCompliant || 'unknown',
    });

    res.status(201).json({ expense });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to save expense.' });
  }
});

// PUT /api/expenses/:id
router.put('/:id', auth, async (req, res) => {
  try {
    const expense = await Expense.findOneAndUpdate(
      { _id: req.params.id, userId: req.user._id },
      req.body,
      { new: true }
    );
    if (!expense) return res.status(404).json({ message: 'Expense not found.' });
    res.json({ expense });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to update expense.' });
  }
});

// DELETE /api/expenses/:id
router.delete('/:id', auth, async (req, res) => {
  try {
    const expense = await Expense.findOneAndDelete({ _id: req.params.id, userId: req.user._id });
    if (!expense) return res.status(404).json({ message: 'Expense not found.' });
    res.json({ message: 'Expense deleted.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to delete expense.' });
  }
});

// POST /api/expenses/upload — upload invoice image
router.post('/upload', auth, upload.single('invoice'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'No file uploaded.' });
    const url = `/uploads/${req.file.filename}`;
    res.json({ url });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'File upload failed.' });
  }
});

// ── V2 ────────────────────────────────────────────────────────────────────────
// GET /api/expenses/check-gstin/:gstin
// Validates a vendor GSTIN format, then queries the public GST portal to check
// whether that taxpayer's registration is currently active.
// No API key required — the GST search API is public for basic lookups.
router.get('/check-gstin/:gstin', auth, async (req, res) => {
  const { gstin } = req.params;
  const gstinUpper = gstin.toUpperCase();

  // Step 1 — Validate the GSTIN format (15-char alphanumeric, fixed structure)
  // Format: 2-digit state code + 10-char PAN + 1-digit entity number + 'Z' + checksum
  const gstinRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
  if (!gstinRegex.test(gstinUpper)) {
    return res.json({
      valid: false,
      active: null,
      message: 'Invalid GSTIN format. A valid GSTIN is 15 characters (e.g. 27AAPFU0939F1ZV).',
    });
  }

  // Step 2 — Query the public GST search API
  try {
    const response = await fetch(
      `https://api.gst.gov.in/commonapi/v1.1/search?action=TP&gstin=${gstinUpper}`,
      { headers: { 'Content-Type': 'application/json' } }
    );

    if (response.ok) {
      const data = await response.json();

      if (data && data.taxpayerInfo) {
        const info = data.taxpayerInfo;
        const isActive = info.sts === 'Active';
        return res.json({
          valid: true,
          active: isActive,
          tradeName: info.tradeNam || info.lgnm || '',
          registrationDate: info.rgdt || '',
          message: isActive
            ? '✅ Vendor GST is active — your ITC is likely safe'
            : '❌ Vendor GST is inactive — ITC may be rejected by the tax department',
        });
      }
    }

    // GST API responded but returned no taxpayer info (could be rate-limited or GSTIN not found)
    return res.json({
      valid: true,
      active: null,
      message: '⚠️ Could not verify vendor compliance — check manually on gst.gov.in',
    });

  } catch (err) {
    // Network error or GST portal is down — fail gracefully, don't block the user
    console.error('GSTIN check error:', err.message);
    return res.json({
      valid: true,
      active: null,
      message: '⚠️ Verification unavailable right now — check manually on gst.gov.in',
    });
  }
});
// ─────────────────────────────────────────────────────────────────────────────

module.exports = router;
