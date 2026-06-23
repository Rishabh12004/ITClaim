require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');
const Expense = require('./models/Expense');

mongoose.connect(process.env.MONGODB_URI)
  .then(async () => {
    const users = await User.find();
    for (const user of users) {
      console.log(`User: ${user.email}`);
      const expenses = await Expense.find({ user: user._id });
      expenses.forEach(e => console.log('  ', e.vendorName, e.vendorGstin, e.amount, e.gstPaid));
    }
    process.exit();
  })
  .catch(err => {
    console.error(err);
    process.exit(1);
  });
