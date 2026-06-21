require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');
const Expense = require('./models/Expense');

async function seed() {
  await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/itclaim');
  console.log('Connected to MongoDB');

  // Create demo user
  let demoUser = await User.findOne({ email: 'demo@itclaim.in' });
  if (!demoUser) {
    demoUser = await User.create({
      name: 'Demo User',
      email: 'demo@itclaim.in',
      password: 'Demo@1234',
      businessName: 'Demo Freelance Co.',
      gstin: '27AAPFU0939F1ZV',
    });
    console.log('✅ Demo user created: demo@itclaim.in / Demo@1234');
  } else {
    console.log('ℹ️  Demo user already exists');
  }

  // Check if demo expenses exist
  const existingCount = await Expense.countDocuments({ userId: demoUser._id });
  if (existingCount > 0) {
    console.log(`ℹ️  Demo already has ${existingCount} expenses. Skipping.`);
    await mongoose.disconnect();
    return;
  }

  const now = new Date();
  const curMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const prevMonth = (m) => {
    const d = new Date(now.getFullYear(), now.getMonth() - m, 1);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  };

  const demoExpenses = [
    // Current month
    { vendorName: 'AWS', description: 'Cloud hosting - EC2 + S3', amount: 8500, gstPaid: 1530, category: 'cloud', itcStatus: 'claimable', itcReason: 'Cloud hosting costs are claimable business expenses', confidence: 'high', filingMonth: curMonth },
    { vendorName: 'Airtel Broadband', description: 'Monthly internet plan', amount: 1000, gstPaid: 180, category: 'internet', itcStatus: 'claimable', itcReason: 'Internet bills are fully claimable as business expenses', confidence: 'high', filingMonth: curMonth },
    { vendorName: 'Figma', description: 'Pro plan subscription', amount: 1500, gstPaid: 270, category: 'software', itcStatus: 'claimable', itcReason: 'Software subscriptions for business use are claimable', confidence: 'high', filingMonth: curMonth },
    { vendorName: 'Swiggy', description: 'Team lunch', amount: 850, gstPaid: 100, category: 'food', itcStatus: 'not_claimable', itcReason: 'Food and beverages are explicitly blocked under Section 17(5) of CGST Act', confidence: 'high', filingMonth: curMonth },
    { vendorName: 'Notion', description: 'Business plan', amount: 1200, gstPaid: 216, category: 'software', itcStatus: 'claimable', itcReason: 'Software subscriptions for business use are claimable', confidence: 'high', filingMonth: curMonth },
    { vendorName: 'Airtel Postpaid', description: 'Mobile bill', amount: 999, gstPaid: 180, category: 'other', itcStatus: 'review', itcReason: 'Phone bills are partially claimable if used for business — needs CA review', confidence: 'medium', filingMonth: curMonth },
    { vendorName: 'Awfis Coworking', description: 'Monthly desk rental', amount: 8000, gstPaid: 1440, category: 'office', itcStatus: 'claimable', itcReason: 'Coworking space rent is claimable as office expense', confidence: 'high', filingMonth: curMonth },
    { vendorName: 'GitHub', description: 'Team plan', amount: 800, gstPaid: 144, category: 'software', itcStatus: 'claimable', itcReason: 'Software subscriptions for business use are claimable', confidence: 'high', filingMonth: curMonth },
    // Previous months for chart data
    { vendorName: 'AWS', description: 'Cloud hosting', amount: 7200, gstPaid: 1296, category: 'cloud', itcStatus: 'claimable', itcReason: 'Cloud hosting costs are claimable', confidence: 'high', filingMonth: prevMonth(1) },
    { vendorName: 'Figma', description: 'Monthly subscription', amount: 1500, gstPaid: 270, category: 'software', itcStatus: 'claimable', itcReason: 'SaaS subscriptions are claimable', confidence: 'high', filingMonth: prevMonth(1) },
    { vendorName: 'Swiggy', description: 'Office lunch', amount: 1200, gstPaid: 150, category: 'food', itcStatus: 'not_claimable', itcReason: 'Food is not claimable under Section 17(5)', confidence: 'high', filingMonth: prevMonth(1) },
    { vendorName: 'Dell Monitor', description: '27 inch 4K monitor', amount: 25000, gstPaid: 4500, category: 'hardware', itcStatus: 'claimable', itcReason: 'Computer hardware for business is claimable', confidence: 'high', filingMonth: prevMonth(2) },
    { vendorName: 'Zoom', description: 'Annual plan', amount: 12000, gstPaid: 2160, category: 'software', itcStatus: 'claimable', itcReason: 'Software subscriptions for business are claimable', confidence: 'high', filingMonth: prevMonth(2) },
    { vendorName: 'Wework', description: 'Hot desk - monthly', amount: 10000, gstPaid: 1800, category: 'office', itcStatus: 'claimable', itcReason: 'Coworking space rent is claimable', confidence: 'high', filingMonth: prevMonth(3) },
    { vendorName: 'Google Workspace', description: 'Business starter', amount: 2500, gstPaid: 450, category: 'software', itcStatus: 'claimable', itcReason: 'SaaS subscriptions are claimable', confidence: 'high', filingMonth: prevMonth(3) },
  ];

  await Expense.insertMany(demoExpenses.map(e => ({
    ...e,
    userId: demoUser._id,
    invoiceDate: new Date(),
  })));

  console.log(`✅ Created ${demoExpenses.length} demo expenses across multiple months`);
  await mongoose.disconnect();
  console.log('Done!');
}

seed().catch(err => {
  console.error('Seed error:', err);
  process.exit(1);
});
