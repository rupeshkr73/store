# 🚀 Rupesh Digital Store

Digital product marketplace — QR Print, Resume Builder, Wedding Card aur aur bhi.

---

## 📁 Folder Structure

```
digital-store/
├── backend/          ← Node.js API (Render pe deploy hoga)
│   ├── server.js
│   ├── routes/
│   │   ├── products.js   ← Public product listing
│   │   └── admin.js      ← Admin CRUD + file upload
│   └── package.json
├── frontend/         ← Static HTML (GitHub Pages pe)
│   ├── index.html    ← Landing + Product listing
│   └── admin.html    ← Admin panel
├── supabase-setup.sql
├── render.yaml
└── README.md
```

---

## ⚡ Setup Steps (Ek baar karna hai)

### Step 1 — Supabase Setup

1. [supabase.com](https://supabase.com) pe jaao → New Project banao
2. Dashboard > SQL Editor → `supabase-setup.sql` ka sara content paste karke Run karo
3. Dashboard > Storage → "New Bucket" → Name: `products` → Public: OFF
4. Settings > API se copy karo:
   - `Project URL` → ye hai `SUPABASE_URL`
   - `service_role` key → ye hai `SUPABASE_SERVICE_KEY`

---

### Step 2 — GitHub pe Push karo

```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/TUMHARA-USERNAME/digital-store.git
git push -u origin main
```

---

### Step 3 — Render pe Backend Deploy

1. [render.com](https://render.com) → New Web Service
2. GitHub repo connect karo
3. Settings:
   - **Build Command:** `cd backend && npm install`
   - **Start Command:** `cd backend && node server.js`
4. Environment Variables daalo:
   ```
   SUPABASE_URL=https://xxx.supabase.co
   SUPABASE_SERVICE_KEY=eyJxxx...
   RAZORPAY_KEY_ID=rzp_live_xxx
   RAZORPAY_KEY_SECRET=xxx
   ADMIN_PASSWORD=apna-secret-password
   FRONTEND_URL=https://TUMHARA-USERNAME.github.io/digital-store
   ```
5. Deploy! URL milega → jaise `https://rupesh-store.onrender.com`

---

### Step 4 — Frontend URL Update karo

`frontend/index.html` aur `frontend/admin.html` mein ye line dhundo:
```javascript
const API = 'https://YOUR-RENDER-APP.onrender.com/api';
```
Apna Render URL daalo, phir push karo.

---

### Step 5 — GitHub Pages Enable karo

1. GitHub repo > Settings > Pages
2. Source: `main` branch → `/frontend` folder
3. Save → URL milega: `https://USERNAME.github.io/digital-store`

---

## 🔧 Admin Panel Use karna

- URL: `https://USERNAME.github.io/digital-store/admin.html`
- Password: jo tumne `ADMIN_PASSWORD` mein set kiya
- Product add karo → name, description, price, thumbnail, file (ZIP/PDF)
- Delete ya Hide/Show kar sakte ho

---

## 💰 Price Format

Admin mein price **₹ mein** daalo (jaise `499`).  
Backend automatically paise mein convert karta hai (×100).

---

## 🔜 Phase 2 (Baad mein)

- [ ] Razorpay payment integration
- [ ] Time-limited download links (after payment)
- [ ] Order history
- [ ] Email confirmation

---

## 🆓 Free Tier Limits

| Service | Free Limit |
|---|---|
| Render (Backend) | 750 hrs/month, sleeps after 15 min inactivity |
| Supabase (DB) | 500MB DB, 1GB Storage |
| GitHub Pages (Frontend) | Unlimited |
| Supabase Storage | 1GB |

> Render pe free tier mein pehli request 30-40 sec lag sakti hai (cold start). Upar wale plan pe jaane se solve hoga.
