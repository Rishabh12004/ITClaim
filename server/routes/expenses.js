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
    const { vendorName, description, amount, gstPaid, category, itcStatus, itcReason, confidence, invoiceDate } = req.body;

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

module.exports = router;
