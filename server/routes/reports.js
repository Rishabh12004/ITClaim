const express = require('express');
const router = express.Router();
const Expense = require('../models/Expense');
const auth = require('../middleware/authMiddleware');

// GET /api/reports/summary
router.get('/summary', auth, async (req, res) => {
  try {
    const userId = req.user._id;

    // Last 6 months
    const months = [];
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      months.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
    }

    // Aggregate by month
    const results = await Expense.aggregate([
      { $match: { userId, filingMonth: { $in: months } } },
      {
        $group: {
          _id: '$filingMonth',
          claimable: { $sum: { $cond: [{ $eq: ['$itcStatus', 'claimable'] }, '$gstPaid', 0] } },
          notClaimable: { $sum: { $cond: [{ $eq: ['$itcStatus', 'not_claimable'] }, '$gstPaid', 0] } },
          review: { $sum: { $cond: [{ $eq: ['$itcStatus', 'review'] }, '$gstPaid', 0] } },
          totalGST: { $sum: '$gstPaid' },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    // Build monthly data with proper labels
    const monthly = months.map(m => {
      const found = results.find(r => r._id === m);
      const date = new Date(m + '-01');
      const label = date.toLocaleDateString('en-IN', { month: 'short', year: '2-digit' });
      return {
        month: label,
        filingMonth: m,
        claimable: found?.claimable || 0,
        notClaimable: found?.notClaimable || 0,
        review: found?.review || 0,
        totalGST: found?.totalGST || 0,
        count: found?.count || 0,
      };
    });

    // Current month stats
    const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    const currentData = results.find(r => r._id === currentMonth) || {};

    // Total all-time
    const totalStats = await Expense.aggregate([
      { $match: { userId } },
      {
        $group: {
          _id: null,
          totalClaimable: { $sum: { $cond: [{ $eq: ['$itcStatus', 'claimable'] }, '$gstPaid', 0] } },
          totalGST: { $sum: '$gstPaid' },
          totalSpent: { $sum: { $add: ['$amount', '$gstPaid'] } },
          count: { $sum: 1 },
        },
      },
    ]);

    const totals = totalStats[0] || {};

    res.json({
      monthly,
      current: {
        claimable: currentData.claimable || 0,
        notClaimable: currentData.notClaimable || 0,
        review: currentData.review || 0,
        totalGST: currentData.totalGST || 0,
        count: currentData.count || 0,
      },
      allTime: {
        totalClaimable: totals.totalClaimable || 0,
        totalGST: totals.totalGST || 0,
        totalSpent: totals.totalSpent || 0,
        count: totals.count || 0,
      },
    });
  } catch (err) {
    console.error('Report error:', err);
    res.status(500).json({ message: 'Failed to generate report.' });
  }
});

// GET /api/reports/category-breakdown
router.get('/category-breakdown', auth, async (req, res) => {
  try {
    const { month } = req.query;
    const match = { userId: req.user._id };
    if (month) match.filingMonth = month;

    const results = await Expense.aggregate([
      { $match: match },
      {
        $group: {
          _id: '$category',
          claimable: { $sum: { $cond: [{ $eq: ['$itcStatus', 'claimable'] }, '$gstPaid', 0] } },
          total: { $sum: '$gstPaid' },
          count: { $sum: 1 },
        },
      },
      { $sort: { claimable: -1 } },
    ]);

    res.json({ breakdown: results });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to get breakdown.' });
  }
});

module.exports = router;
