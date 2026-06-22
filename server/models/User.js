const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name:         { type: String, required: true, trim: true },
  email:        { type: String, required: true, unique: true, lowercase: true, trim: true },
  password:     { type: String, required: true, minlength: 6 },
  gstin:        { type: String, trim: true, uppercase: true },
  businessName: { type: String, trim: true },

  // ── V2 addition ───────────────────────────────────────────────────────────
  // Controls whether the cron job sends GST deadline reminder emails to this user.
  // true  → user receives reminders on the 13th and 18th of each month (if they have claimable ITC)
  // false → user has opted out; cron skips them entirely
  // Default is true so all new users are opted in automatically.
  // Existing users in MongoDB without this field will evaluate as falsy, so the cron
  // uses User.find({ emailReminders: true }) which correctly excludes them until they
  // explicitly toggle it ON in Settings.
  emailReminders: { type: Boolean, default: true },
  // ─────────────────────────────────────────────────────────────────────────

}, { timestamps: true });

// Hash password before save
userSchema.pre('save', async function () {
  if (!this.isModified('password')) return;
  this.password = await bcrypt.hash(this.password, 12);
});

// Compare password
userSchema.methods.comparePassword = async function (candidate) {
  return bcrypt.compare(candidate, this.password);
};

// Strip password from JSON output
userSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.password;
  return obj;
};

module.exports = mongoose.model('User', userSchema);