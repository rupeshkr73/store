require('dotenv').config();
const express = require('express');
const cors = require('cors');
const app = express();

// ── Middleware ──────────────────────────────
app.use(cors({
  origin: [
    process.env.FRONTEND_URL || '*',
    'http://localhost:5500',
    'http://127.0.0.1:5500'
  ]
}));
app.use(express.json());

// ── Routes ──────────────────────────────────
const productsRoute = require('./routes/products');
const adminRoute = require('./routes/admin');

app.use('/api/products', productsRoute);
app.use('/api/admin', adminRoute);

// ── Health check ────────────────────────────
app.get('/', (req, res) => {
  res.json({ 
    status: 'ok', 
    message: 'Rupesh Digital Store API running',
    time: new Date().toISOString()
  });
});

// ── Start ────────────────────────────────────
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
