require('dotenv').config();
const express = require('express');
const cors = require('cors');
const app = express();

app.use(cors({ origin: '*' }));
app.use(express.json());

const productsRoute = require('./routes/products');
const adminRoute = require('./routes/admin');
const paymentRoute = require('./routes/payment');

app.use('/api/products', productsRoute);
app.use('/api/admin', adminRoute);
app.use('/api/payment', paymentRoute);

app.get('/', (req, res) => {
  res.json({ status: 'ok', message: 'Rupesh Digital Store API running' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
