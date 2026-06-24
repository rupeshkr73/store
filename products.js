const express = require('express');
const router = express.Router();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

// ── GET /api/products — Public listing ──────
router.get('/', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('products')
      .select('id, name, description, price, category, thumbnail_url, created_at')
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (error) throw error;
    res.json({ success: true, products: data });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── GET /api/products/:id — Single product ──
router.get('/:id', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('products')
      .select('id, name, description, price, category, thumbnail_url, created_at')
      .eq('id', req.params.id)
      .eq('is_active', true)
      .single();

    if (error) throw error;
    if (!data) return res.status(404).json({ success: false, message: 'Product not found' });

    res.json({ success: true, product: data });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
