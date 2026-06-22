const mongoose = require('mongoose');

const expenseSchema = new mongoose.Schema({
  userId:      { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  vendorName:  { type: String, required: true, trim: true },
  description: { type: String, trim: true },
  amount:      { type: Number, required: true, min: 0 },
  gstPaid:     { type: Number, required: true, min: 0 },
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
  itcReason:  { type: String },
  confidence: {
    type: String,
    enum: ['high', 'medium', 'low'],
    default: 'low',
  },
  invoiceUrl:  { type: String },
  invoiceDate: { type: Date, default: Date.now },
  filingMonth: { type: String, index: true }, // "2024-03"

  // ── V2 additions ──────────────────────────────────────────────────────────
  // Vendor GSTIN captured from the invoice or entered manually by the user.
  // Stored in uppercase (e.g. "27AAPFU0939F1ZV").
  vendorGstin: { type: String, trim: true, uppercase: true },

  // Result of the live GSTIN compliance check against the GST portal.
  // 'yes'     → vendor's GST registration is active; ITC is likely safe.
  // 'no'      → vendor's GST is inactive/cancelled; ITC may be rejected by the department.
  // 'unknown' → check was skipped, API was unavailable, or GSTIN was not provided.
  vendorCompliant: {
    type: String,
    enum: ['yes', 'no', 'unknown'],
    default: 'unknown',
  },
  // ─────────────────────────────────────────────────────────────────────────

}, { timestamps: true });

// Auto-set filingMonth before save
expenseSchema.pre('save', function () {
  if (!this.filingMonth) {
    const d = this.invoiceDate || this.createdAt || new Date();
    this.filingMonth = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  }
});

module.exports = mongoose.model('Expense', expenseSchema);
