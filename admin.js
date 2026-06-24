const express = require('express');
const router = express.Router();
const { createClient } = require('@supabase/supabase-js');
const multer = require('multer');
const { v4: uuidv4 } = require('uuid');
const path = require('path');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

// ── Multer (memory storage, Supabase pe upload karega) ──
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024 } // 50MB max
});

// ── Admin Auth Middleware ────────────────────
function adminAuth(req, res, next) {
  const password = req.headers['x-admin-password'];
  if (password !== process.env.ADMIN_PASSWORD) {
    return res.status(401).json({ success: false, message: 'Unauthorized' });
  }
  next();
}

// ── POST /api/admin/login ────────────────────
router.post('/login', (req, res) => {
  const { password } = req.body;
  if (password === process.env.ADMIN_PASSWORD) {
    res.json({ success: true, message: 'Login successful' });
  } else {
    res.status(401).json({ success: false, message: 'Wrong password' });
  }
});

// ── GET /api/admin/products — All products ──
router.get('/products', adminAuth, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    res.json({ success: true, products: data });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── POST /api/admin/products — Create product ──
router.post(
  '/products',
  adminAuth,
  upload.fields([
    { name: 'thumbnail', maxCount: 1 },
    { name: 'file', maxCount: 1 }
  ]),
  async (req, res) => {
    try {
      const { name, description, price, category } = req.body;

      if (!name || !price || !req.files?.file) {
        return res.status(400).json({
          success: false,
          message: 'Name, price aur product file required hai'
        });
      }

      let thumbnail_url = null;
      let file_url = null;
      const productId = uuidv4();

      // Upload thumbnail (agar diya ho)
      if (req.files?.thumbnail) {
        const thumb = req.files.thumbnail[0];
        const thumbPath = `${productId}/thumbnail${path.extname(thumb.originalname)}`;
        const { error: thumbErr } = await supabase.storage
          .from('products')
          .upload(thumbPath, thumb.buffer, { contentType: thumb.mimetype });

        if (thumbErr) throw thumbErr;

        const { data: thumbUrl } = supabase.storage
          .from('products')
          .getPublicUrl(thumbPath);
        thumbnail_url = thumbUrl.publicUrl;
      }

      // Upload product file
      const productFile = req.files.file[0];
      const filePath = `${productId}/file${path.extname(productFile.originalname)}`;
      const { error: fileErr } = await supabase.storage
        .from('products')
        .upload(filePath, productFile.buffer, { contentType: productFile.mimetype });

      if (fileErr) throw fileErr;
      file_url = filePath; // Store path, not public URL (private file)

      // DB me save karo
      const { data, error } = await supabase
        .from('products')
        .insert({
          id: productId,
          name,
          description,
          price: parseInt(price),
          category: category || 'general',
          thumbnail_url,
          file_url,
          file_name: productFile.originalname
        })
        .select()
        .single();

      if (error) throw error;
      res.json({ success: true, product: data });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  }
);

// ── DELETE /api/admin/products/:id ──────────
router.delete('/products/:id', adminAuth, async (req, res) => {
  try {
    const { id } = req.params;

    // Pehle product lo (file path ke liye)
    const { data: product } = await supabase
      .from('products')
      .select('file_url, thumbnail_url')
      .eq('id', id)
      .single();

    // Storage se file delete karo
    if (product?.file_url) {
      await supabase.storage.from('products').remove([product.file_url]);
    }

    // DB se delete karo (soft delete — is_active false)
    const { error } = await supabase
      .from('products')
      .update({ is_active: false })
      .eq('id', id);

    if (error) throw error;
    res.json({ success: true, message: 'Product deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── PATCH /api/admin/products/:id — Update price/details ──
router.patch('/products/:id', adminAuth, async (req, res) => {
  try {
    const { name, description, price, category, is_active } = req.body;
    const updates = {};

    if (name !== undefined) updates.name = name;
    if (description !== undefined) updates.description = description;
    if (price !== undefined) updates.price = parseInt(price);
    if (category !== undefined) updates.category = category;
    if (is_active !== undefined) updates.is_active = is_active;

    const { data, error } = await supabase
      .from('products')
      .update(updates)
      .eq('id', req.params.id)
      .select()
      .single();

    if (error) throw error;
    res.json({ success: true, product: data });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
