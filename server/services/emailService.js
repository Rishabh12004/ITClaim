// server/services/emailService.js
// Sends GST deadline reminder emails using Gmail SMTP (free, no paid service needed).
//
// SETUP REQUIRED (one-time):
// 1. Add these two vars to your Render environment (or server/.env for local):
//    GMAIL_USER=your_gmail_address@gmail.com
//    GMAIL_APP_PASS=xxxx xxxx xxxx xxxx   ← 16-char App Password (NOT your real password)
//
// How to get a Gmail App Password:
//   a. Go to myaccount.google.com → Security
//   b. Turn ON 2-Step Verification (required)
//   c. Security → App Passwords
//   d. Select app: Mail, device: Other → type "ITClaim" → Generate
//   e. Copy the 16-character password shown — paste it as GMAIL_APP_PASS

const nodemailer = require('nodemailer');

// Create a reusable transporter using Gmail SMTP.
// nodemailer will throw at send-time (not here) if credentials are wrong,
// so the server boots fine even if env vars haven't been set yet.
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASS,
  },
});

/**
 * Send a GST filing deadline reminder to a single user.
 *
 * @param {object} opts
 * @param {string} opts.toEmail       - Recipient email address
 * @param {string} opts.userName      - User's first name (shown in greeting)
 * @param {number} opts.claimableAmount - Total claimable ITC this month (₹)
 * @param {number} opts.daysLeft      - Days remaining until the 20th deadline
 * @param {string} opts.filingMonth   - Filing period string e.g. "June 2026"
 */
async function sendDeadlineReminder({ toEmail, userName, claimableAmount, daysLeft, filingMonth }) {
  const formattedAmount = '₹' + Number(claimableAmount).toLocaleString('en-IN');
  const isUrgent = daysLeft <= 3;

  const html = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <title>GST Filing Reminder — ITClaim</title>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
          background: #0F1117;
          color: #ffffff;
          padding: 24px 16px;
        }
        .container  { max-width: 560px; margin: 0 auto; }
        .logo-wrap  { text-align: center; padding: 28px 0 20px; }
        .logo       {
          background: #00D4AA; color: #0F1117;
          padding: 8px 18px; border-radius: 8px;
          font-weight: 700; font-size: 18px;
          display: inline-block; letter-spacing: -0.3px;
        }
        .card {
          background: #1A1D27;
          border: 1px solid #2A2F45;
          border-radius: 14px;
          padding: 28px;
          margin: 16px 0;
        }
        .greeting   { font-size: 15px; color: #C5C8D8; margin-bottom: 14px; }
        .alert-line {
          font-size: 15px; font-weight: 600;
          color: ${isUrgent ? '#FF6B6B' : '#F5A623'};
          margin-bottom: 10px;
        }
        .body-text  { font-size: 14px; color: #8B90A7; line-height: 1.65; margin-bottom: 8px; }
        .amount     { font-size: 40px; font-weight: 700; color: #00D4AA; margin: 14px 0 4px; }
        .sub-amount { font-size: 13px; color: #8B90A7; margin-bottom: 18px; }
        .btn {
          display: inline-block;
          background: #00D4AA; color: #0F1117;
          padding: 13px 30px; border-radius: 8px;
          text-decoration: none; font-weight: 700;
          font-size: 14px; margin: 18px 0 6px;
        }
        .divider    { height: 1px; background: #2A2F45; margin: 22px 0; }
        .tip-label  {
          font-size: 11px; font-weight: 700; letter-spacing: 0.08em;
          text-transform: uppercase; color: #8B90A7; margin-bottom: 10px;
        }
        .tip-item   { font-size: 13px; color: #8B90A7; margin-bottom: 6px; display: flex; gap: 8px; }
        .footer     { color: #8B90A7; font-size: 11px; text-align: center; margin-top: 28px; line-height: 1.8; }
        .footer a   { color: #8B90A7; text-decoration: underline; }
      </style>
    </head>
    <body>
      <div class="container">

        <div class="logo-wrap">
          <span class="logo">ITClaim</span>
        </div>

        <div class="card">
          <p class="greeting">Hey ${userName},</p>

          <p class="alert-line">
            ${isUrgent ? '🚨 Urgent: ' : '⏰ '}
            GST filing for <strong>${filingMonth}</strong> is due in
            <strong>${daysLeft} day${daysLeft !== 1 ? 's' : ''}</strong>
            (20th of this month)
          </p>

          <p class="body-text">
            You have claimable ITC this month that you'll <strong>permanently lose</strong>
            if you don't file GSTR-3B before the deadline:
          </p>

          <div class="amount">${formattedAmount}</div>
          <p class="sub-amount">← that's ${formattedAmount} the government owes you back</p>

          <p class="body-text">
            Export your ITC report from ITClaim, share it with your CA, and file before the 20th.
          </p>

          <a href="https://it-claim.vercel.app/report" class="btn">
            View My ITC Report →
          </a>

          <div class="divider"></div>

          <div class="tip-label">Quick checklist</div>
          <div class="tip-item"><span>✓</span><span>All invoices logged in ITClaim</span></div>
          <div class="tip-item"><span>✓</span><span>Vendor GSTINs verified as active</span></div>
          <div class="tip-item"><span>✓</span><span>GSTR-2B downloaded and reconciled</span></div>
          <div class="tip-item"><span>✓</span><span>Report shared with CA</span></div>
          <div class="tip-item"><span>✓</span><span>GSTR-3B filed before the 20th</span></div>
        </div>

        <div class="footer">
          <p>ITClaim · Built for Indian freelancers &amp; SMEs</p>
          <p>Not a registered CA firm. Always consult a qualified CA for complex tax matters.</p>
          <p style="margin-top: 8px;">
            You're receiving this because you're registered on ITClaim.
            <br/>
            <a href="https://it-claim.vercel.app/settings">Manage email preferences</a>
          </p>
        </div>

      </div>
    </body>
    </html>
  `;

  await transporter.sendMail({
    from:    `"ITClaim" <${process.env.GMAIL_USER}>`,
    to:      toEmail,
    subject: `⏰ ${daysLeft} day${daysLeft !== 1 ? 's' : ''} left to claim ${formattedAmount} in GST credits`,
    html,
  });
}

module.exports = { sendDeadlineReminder };
