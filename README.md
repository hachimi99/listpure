# ListPure — Email List Hygiene Tool

## 🚀 Setup في 5 دقائق

### 1. Install dependencies
```bash
npm install
```

### 2. Run locally
```bash
npm run dev
```
افتح http://localhost:3000

### 3. Deploy على Vercel
```bash
# إذا عندك Vercel CLI
npx vercel

# أو ارفع على GitHub وربط بـ Vercel من Dashboard
```

---

## 📁 Structure

```
listpure/
├── app/
│   ├── layout.js          # Root layout
│   ├── page.js            # Main UI (upload + results)
│   └── api/
│       └── validate/
│           └── route.js   # Email validation engine
├── package.json
└── next.config.js
```

---

## ✅ ما يعمل دابا

- CSV upload (drag & drop أو click)
- Syntax validation
- MX record check (DNS lookup)
- Disposable email detection (35+ domains)
- Role-based email detection (admin@, info@, etc.)
- Duplicate removal
- Deliverability score
- Download: clean CSV + full report + invalid list
- Free tier: 500 emails max

---

## 🔜 الخطوات التالية

1. **Stripe integration** — باش تضيف الـ paid plans
2. **MillionVerifier API** — لـ SMTP verification أعمق (paid)
3. **User auth** — Clerk أو NextAuth
4. **Usage tracking** — حساب emails الشهرية

---

## 💰 Pricing

| Plan | Price | Limit |
|------|-------|-------|
| Free | $0 | 500/month |
| Starter | $29/month | 10,000/month |
| Pro | $59/month | 50,000/month |
| Agency | $99/month | 200,000/month |
