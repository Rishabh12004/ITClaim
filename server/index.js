require('dotenv').config();
const express  = require('express');
const mongoose = require('mongoose');
const cors     = require('cors');
const path     = require('path');

// V2 — Email reminder cron (fires 13th & 18th at 9 AM IST)
const { startReminderCron } = require('./services/reminderCron');

const app = express();
const PORT = process.env.PORT || 5000;

// CORS
app.use(cors({
  origin: process.env.CLIENT_URL || ['http://localhost:5173', 'http://localhost:3000'],
  credentials: true,
}));

// Body parser
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Static uploads
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/expenses', require('./routes/expenses'));
app.use('/api/reports', require('./routes/reports'));

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'ITClaim API is running', timestamp: new Date().toISOString() });
});

// 404
app.use((req, res) => {
  res.status(404).json({ message: `Route ${req.method} ${req.path} not found` });
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({ message: err.message || 'Internal server error' });
});

// Connect to MongoDB and start server
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/itclaim')
  .then(async () => {
    console.log('✅ MongoDB connected');

    // V2 — Start the GST deadline email reminder cron job
    startReminderCron();

    // Seed demo user if no users exist
    try {
      const User = require('./models/User');
      const existingDemo = await User.findOne({ email: 'demo@itclaim.in' });
      if (!existingDemo) {
        await User.create({
          name: 'Demo User',
          email: 'demo@itclaim.in',
          password: 'Demo@1234',
          businessName: 'Demo Freelance Co.',
          gstin: '27AAPFU0939F1ZV',
        });
        console.log('✅ Demo user created: demo@itclaim.in / Demo@1234');
        
        // Add some demo expenses
        const Expense = require('./models/Expense');
        const demoUser = await User.findOne({ email: 'demo@itclaim.in' });
        const now = new Date();
        const month = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

        const demoExpenses = [
          { vendorName: 'AWS', description: 'Cloud hosting - EC2 + S3', amount: 8500, gstPaid: 1530, category: 'cloud', itcStatus: 'claimable', itcReason: 'Cloud hosting costs are claimable business expenses', confidence: 'high' },
          { vendorName: 'Airtel Broadband', description: 'Monthly internet plan', amount: 1000, gstPaid: 180, category: 'internet', itcStatus: 'claimable', itcReason: 'Internet bills are fully claimable as business expenses', confidence: 'high' },
          { vendorName: 'Figma', description: 'Pro plan subscription', amount: 1500, gstPaid: 270, category: 'software', itcStatus: 'claimable', itcReason: 'Software subscriptions for business use are claimable', confidence: 'high' },
          { vendorName: 'Swiggy', description: 'Team lunch', amount: 850, gstPaid: 100, category: 'food', itcStatus: 'not_claimable', itcReason: 'Food and beverages are explicitly blocked under Section 17(5) of CGST Act', confidence: 'high' },
          { vendorName: 'Notion', description: 'Business plan', amount: 1200, gstPaid: 216, category: 'software', itcStatus: 'claimable', itcReason: 'Software subscriptions for business use are claimable', confidence: 'high' },
          { vendorName: 'Airtel Postpaid', description: 'Mobile bill - Nov', amount: 999, gstPaid: 180, category: 'other', itcStatus: 'review', itcReason: 'Phone bills are partially claimable if used for business — needs CA review', confidence: 'medium' },
          { vendorName: 'Awfis Coworking', description: 'Monthly desk rental', amount: 8000, gstPaid: 1440, category: 'office', itcStatus: 'claimable', itcReason: 'Coworking space rent is claimable as office expense', confidence: 'high' },
          { vendorName: 'GitHub', description: 'Team plan', amount: 800, gstPaid: 144, category: 'software', itcStatus: 'claimable', itcReason: 'Software subscriptions for business use are claimable', confidence: 'high' },
        ];

        await Expense.insertMany(demoExpenses.map(e => ({
          ...e,
          userId: demoUser._id,
          filingMonth: month,
          invoiceDate: new Date(),
        })));
        console.log('✅ Demo expenses created');
      }
    } catch (e) {
      console.log('Demo seed skipped:', e.message);
    }

    app.listen(PORT, () => {
      console.log(`🚀 ITClaim server running on http://localhost:${PORT}`);
    });
  })
  .catch(err => {
    console.error('❌ MongoDB connection failed:', err.message);
    console.log('💡 Make sure MongoDB is running or set MONGODB_URI in .env');
    // Still start the server for health checks
    app.listen(PORT, () => {
      console.log(`⚠️  Server running on port ${PORT} (without database)`);
    });
  });

module.exports = app;
