const mongoose = require('mongoose');

const expenseSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  vendorName: { type: String, required: true, trim: true },
  description: { type: String, trim: true },
  amount: { type: Number, required: true, min: 0 },
  gstPaid: { type: Number, required: true, min: 0 },
  category: {
    type: String,
    enum: ['internet', 'software', 'hardware', 'cloud', 'office', 'professional', 'marketing', 'travel', 'food', 'other'],
    default: 'other',
  },
  itcStatus: {
    type: String,
    enum: ['claimable', 'not_claimable', 'review'],
    default: 'review',
    index: true,
  },
  itcReason: { type: String },
  confidence: {
    type: String,
    enum: ['high', 'medium', 'low'],
    default: 'low',
  },
  invoiceUrl: { type: String },
  invoiceDate: { type: Date, default: Date.now },
  filingMonth: { type: String, index: true }, // "2024-03"
}, { timestamps: true });

// Auto-set filingMonth before save
expenseSchema.pre('save', function () {
  if (!this.filingMonth) {
    const d = this.invoiceDate || this.createdAt || new Date();
    this.filingMonth = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  }
});

module.exports = mongoose.model('Expense', expenseSchema);
