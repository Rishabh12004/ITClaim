# ITClaim — GST Input Tax Credit Tracker

> Stop overpaying GST. Claim what's yours.

A full-stack web app for Indian freelancers and small business owners to track Input Tax Credit (ITC) on their business expenses.

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- MongoDB (local or Atlas)
- Modern browser

### 1. Start MongoDB
```bash
brew services start mongodb-community
```
Or use MongoDB Atlas — update `MONGODB_URI` in `server/.env`

### 2. Start Backend
```bash
cd server
npm start
# Runs on http://localhost:5001
```

### 3. Seed Demo Data
```bash
cd server
node seed.js
```

### 4. Start Frontend
```bash
cd client
npm run dev
# Opens at http://localhost:5173
```

---

## 🔑 Demo Credentials

| Field | Value |
|-------|-------|
| Email | `demo@itclaim.in` |
| Password | `Demo@1234` |

---

## 📁 Project Structure

```
ITClaim/
├── client/          # React + Vite + TailwindCSS
│   └── src/
│       ├── pages/   # Landing, Login, Register, Dashboard, Expenses, Scanner, Report, Settings
│       ├── components/  # Navbar, SavingsWidget, ITCBadge, DeadlineBanner, AddExpenseModal
│       ├── context/ # AuthContext (JWT)
│       └── utils/   # itcRules.js (ITC brain)
│
└── server/          # Node.js + Express + MongoDB
    ├── models/      # User, Expense
    ├── routes/      # auth, expenses, reports
    └── middleware/  # authMiddleware
```

---

## ✨ Features

- **Instant ITC Detection** — Type a vendor name, get an immediate claimable/not-claimable verdict
- **Invoice Scanner** — Drag & drop invoice images, Tesseract.js OCR auto-fills fields
- **Deadline Reminders** — Auto-shows warning banner when GST filing is within 14 days
- **Monthly Reports** — Bar + pie charts, exportable PDF for your CA
- **Dark Theme** — Premium dark UI with Space Grotesk + JetBrains Mono typography
- **Mobile Ready** — Bottom navigation bar, responsive layouts

---

## 🧠 ITC Rules Engine

`client/src/utils/itcRules.js` contains the core logic that classifies expenses:

| Status | Examples |
|--------|---------|
| ✅ Claimable | AWS, Figma, Airtel Broadband, Coworking, Laptops |
| ❌ Not Claimable | Swiggy, Uber, Petrol, Netflix, Groceries |
| ⚠️ Review | Mobile bills, Electricity, Amazon purchases |

---

## 🌐 Deployment

### Frontend → Vercel
```bash
cd client && npm run build
# Deploy dist/ to Vercel
```

### Backend → Render
```bash
# Set environment variables in Render:
# MONGODB_URI=<your Atlas URI>
# JWT_SECRET=<random 64-char string>
# CLIENT_URL=<your Vercel URL>
```

---

## 📋 Environment Variables

### server/.env
```
PORT=5001
MONGODB_URI=mongodb://localhost:27017/itclaim
JWT_SECRET=your_secret_here
CLIENT_URL=http://localhost:5173
```

### client/.env
```
VITE_API_URL=http://localhost:5001/api
```

---

## 📖 GST ITC Rules Reference

- **Filing deadline:** GSTR-3B by 20th of the following month
- **ITC lost if:** Not claimed in the same financial year
- **Blocked categories:** Food/beverages, motor vehicle fuel, personal expenses (Section 17(5) CGST)
- **Eligible:** Internet, cloud hosting, coworking, hardware, SaaS, professional fees, marketing

> ⚠️ This tool is for reference only. Always consult a qualified CA for filing.
