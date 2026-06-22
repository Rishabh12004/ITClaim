// server/services/reminderCron.js
// Schedules automated GST deadline reminder emails using node-cron.
// Runs INSIDE the existing Render free-tier server process — no extra cost.
//
// Schedule: 9:00 AM IST on the 13th and 18th of every month.
//   → 13th = 7 days before the 20th deadline  (early heads-up)
//   → 18th = 2 days before the 20th deadline  (urgent final nudge)
//
// Only sends to users who:
//   a) Have emailReminders === true (opt-in, set in Settings)
//   b) Have at least ₹1 of claimable ITC for the current filing month
//      (no point spamming users who have nothing to claim)

const cron                  = require('node-cron');
const User                  = require('../models/User');
const Expense               = require('../models/Expense');
const { sendDeadlineReminder } = require('./emailService');

/**
 * Register the cron job with node-cron.
 * Call this once from server/index.js after MongoDB connects.
 */
function startReminderCron() {
  // Cron expression: minute hour day-of-month month day-of-week
  // '0 3 13,18 * *'  → 03:30 UTC = ~09:00 IST (UTC+5:30)
  // (Render servers run on UTC, so we subtract 5h30m from 09:00 IST)
  cron.schedule('0 3 13,18 * *', async () => {
    console.log('\n⏰ [Cron] GST deadline reminder job started —', new Date().toISOString());

    try {
      const now          = new Date();
      const year         = now.getFullYear();
      const month        = now.getMonth(); // 0-indexed

      // Current filing month string, e.g. "2026-06"
      const currentMonth = `${year}-${String(month + 1).padStart(2, '0')}`;

      // Deadline is always the 20th of the CURRENT month
      // (the cron fires on 13th / 18th, both before the 20th)
      const deadline  = new Date(year, month, 20, 23, 59, 59);
      const msLeft    = deadline - now;
      const daysLeft  = Math.ceil(msLeft / (1000 * 60 * 60 * 24));

      // Safety check — if somehow the deadline has already passed, skip
      if (daysLeft <= 0) {
        console.log('[Cron] Deadline already passed for this month — skipping.');
        return;
      }

      // Formatted filing period for the email body, e.g. "June 2026"
      const filingPeriod = now.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });

      // Fetch all users who have opted in to email reminders
      const users = await User.find({ emailReminders: true }).lean();
      console.log(`[Cron] Found ${users.length} opted-in user(s). Days left: ${daysLeft}`);

      let sent = 0, skipped = 0, failed = 0;

      for (const user of users) {
        try {
          // Sum up all claimable GST paid by this user in the current filing month
          const claimableExpenses = await Expense.find({
            userId:      user._id,
            filingMonth: currentMonth,
            itcStatus:   'claimable',
          }).lean();

          const claimableAmount = claimableExpenses.reduce((sum, e) => sum + (e.gstPaid || 0), 0);

          // Skip users with nothing to claim — don't send pointless emails
          if (claimableAmount <= 0) {
            console.log(`[Cron] Skipping ${user.email} — no claimable ITC this month.`);
            skipped++;
            continue;
          }

          // First name only for the greeting (e.g. "Rishabh" from "Rishabh Hirwe")
          const firstName = (user.name || 'there').split(' ')[0];

          await sendDeadlineReminder({
            toEmail:         user.email,
            userName:        firstName,
            claimableAmount,
            daysLeft,
            filingMonth:     filingPeriod,
          });

          console.log(`[Cron] ✅ Sent to ${user.email} — ₹${claimableAmount.toLocaleString('en-IN')} claimable`);
          sent++;

          // Small delay between emails to avoid Gmail rate limits (1 email/sec max on free tier)
          await new Promise(resolve => setTimeout(resolve, 1000));

        } catch (userErr) {
          // One user failing should NOT stop the rest from getting their emails
          console.error(`[Cron] ❌ Failed for ${user.email}:`, userErr.message);
          failed++;
        }
      }

      console.log(`[Cron] Job complete — sent: ${sent}, skipped: ${skipped}, failed: ${failed}\n`);

    } catch (err) {
      // Top-level error (e.g. DB unreachable) — log and continue, don't crash the server
      console.error('[Cron] ❌ Top-level cron error:', err.message);
    }
  }, {
    // Run in IST timezone so the cron expression is easier to reason about
    // (node-cron supports IANA timezone strings)
    timezone: 'Asia/Kolkata',
  });

  // Confirmation log on startup
  console.log('✅ GST deadline reminder cron scheduled:');
  console.log('   → 9:00 AM IST on the 13th of every month (7-day warning)');
  console.log('   → 9:00 AM IST on the 18th of every month (2-day urgent nudge)');
}

module.exports = { startReminderCron };
