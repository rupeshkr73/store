require('dotenv').config();
const express = require('express');
const router = express.Router();
const Razorpay = require('razorpay');
const crypto = require('crypto');
const { createClient } = require('@supabase/supabase-js');
const { v4: uuidv4 } = require('uuid');
const nodemailer = require('nodemailer');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET
});

// Mailtrap transporter
const transporter = nodemailer.createTransport({
  host: 'smtp.mailtrap.io',
  port: 587,
  auth: {
    user: process.env.MAILTRAP_USER,
    pass: process.env.MAILTRAP_PASS
  }
});

// ── POST /api/payment/create-order ──────────
router.post('/create-order', async (req, res) => {
  try {
    const { product_id, buyer_name, buyer_email } = req.body;

    if (!product_id || !buyer_email || !buyer_name) {
      return res.status(400).json({ success: false, message: 'Sab fields required hain' });
    }

    // Product fetch karo
    const { data: product, error } = await supabase
      .from('products')
      .select('*')
      .eq('id', product_id)
      .eq('is_active', true)
      .single();

    if (error || !product) {
      return res.status(404).json({ success: false, message: 'Product nahi mila' });
    }

    // Razorpay order banao
    const order = await razorpay.orders.create({
      amount: product.price, // already in paise
      currency: 'INR',
      receipt: `order_${Date.now()}`,
      notes: { product_id, buyer_email, buyer_name }
    });

    // DB mein order save karo
    await supabase.from('orders').insert({
      product_id,
      buyer_email,
      buyer_name,
      razorpay_order_id: order.id,
      amount: product.price,
      status: 'pending'
    });

    res.json({
      success: true,
      order_id: order.id,
      amount: product.price,
      product_name: product.name,
      key_id: process.env.RAZORPAY_KEY_ID
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── POST /api/payment/verify ─────────────────
router.post('/verify', async (req, res) => {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      buyer_email,
      buyer_name,
      product_id
    } = req.body;

    // Signature verify karo
    const body = razorpay_order_id + '|' + razorpay_payment_id;
    const expectedSig = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(body)
      .digest('hex');

    if (expectedSig !== razorpay_signature) {
      return res.status(400).json({ success: false, message: 'Payment verify nahi hua' });
    }

    // Download token generate karo
    const download_token = uuidv4();
    const token_expires_at = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    // Order update karo
    await supabase
      .from('orders')
      .update({
        razorpay_payment_id,
        status: 'paid',
        download_token,
        token_expires_at
      })
      .eq('razorpay_order_id', razorpay_order_id);

    // Product details lo
    const { data: product } = await supabase
      .from('products')
      .select('name, price')
      .eq('id', product_id)
      .single();

    const downloadUrl = `${process.env.FRONTEND_URL}/download.html?token=${download_token}`;

    // Email bhejo
    await transporter.sendMail({
      from: '"Rupesh Digital Store" <store@rupeshdigital.com>',
      to: buyer_email,
      subject: `✅ Payment Successful — ${product?.name}`,
      html: `
        <div style="font-family:Arial,sans-serif;max-width:500px;margin:0 auto;padding:24px;background:#f9f9f9;border-radius:12px;">
          <h2 style="color:#4f46e5;">Payment Successful! 🎉</h2>
          <p>Namaste <strong>${buyer_name}</strong>,</p>
          <p>Aapka payment receive ho gaya. Neeche download link hai:</p>
          <div style="background:#fff;border:1px solid #ddd;border-radius:8px;padding:16px;margin:20px 0;">
            <p><strong>Product:</strong> ${product?.name}</p>
            <p><strong>Amount:</strong> ₹${(product?.price / 100).toFixed(0)}</p>
            <p><strong>Payment ID:</strong> ${razorpay_payment_id}</p>
          </div>
          <a href="${downloadUrl}" style="display:inline-block;background:#4f46e5;color:#fff;padding:14px 28px;border-radius:8px;text-decoration:none;font-weight:bold;">
            📥 Download Karo
          </a>
          <p style="color:#999;font-size:12px;margin-top:20px;">
            ⚠️ Ye link 24 ghante mein expire ho jayega.<br/>
            Koi problem ho to WhatsApp karo: 7992384657
          </p>
        </div>
      `
    });

    res.json({ success: true, download_token, message: 'Payment verified! Email bhej diya.' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── GET /api/payment/download/:token ────────
router.get('/download/:token', async (req, res) => {
  try {
    const { token } = req.params;

    // Token se order dhundo
    const { data: order, error } = await supabase
      .from('orders')
      .select('*, products(name, file_url, file_name)')
      .eq('download_token', token)
      .eq('status', 'paid')
      .single();

    if (error || !order) {
      return res.status(404).json({ success: false, message: 'Invalid ya expired link' });
    }

    // Token expire check
    if (new Date() > new Date(order.token_expires_at)) {
      return res.status(410).json({ success: false, message: 'Download link expire ho gaya. WhatsApp karo: 7992384657' });
    }

    // Supabase Storage se signed URL lo
    const { data: signedUrl, error: urlErr } = await supabase.storage
      .from('products')
      .createSignedUrl(order.products.file_url, 3600); // 1 hour valid

    if (urlErr) throw urlErr;

    res.json({
      success: true,
      download_url: signedUrl.signedUrl,
      product_name: order.products.name,
      file_name: order.products.file_name
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
