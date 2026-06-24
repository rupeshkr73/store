-- ============================================
-- DIGITAL STORE - Supabase Setup SQL
-- Ye SQL Supabase Dashboard > SQL Editor me run karo
-- ============================================

-- 1. Products Table
CREATE TABLE products (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  price INTEGER NOT NULL, -- price in paise (100 = ₹1)
  category TEXT DEFAULT 'general',
  thumbnail_url TEXT,
  file_url TEXT NOT NULL,
  file_name TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Orders Table (payment ke baad)
CREATE TABLE orders (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID REFERENCES products(id),
  buyer_email TEXT NOT NULL,
  buyer_name TEXT,
  razorpay_order_id TEXT,
  razorpay_payment_id TEXT,
  amount INTEGER NOT NULL,
  status TEXT DEFAULT 'pending', -- pending, paid, failed
  download_token TEXT UNIQUE,
  token_expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Row Level Security (RLS) - Public sirf active products dekh sake
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

-- Public read policy for products
CREATE POLICY "Public can view active products"
  ON products FOR SELECT
  USING (is_active = true);

-- Service role can do everything (backend use karega)
CREATE POLICY "Service role full access products"
  ON products FOR ALL
  USING (auth.role() = 'service_role');

CREATE POLICY "Service role full access orders"
  ON orders FOR ALL
  USING (auth.role() = 'service_role');

-- 4. Storage Bucket banana
-- Supabase Dashboard > Storage > New Bucket
-- Name: "products"
-- Public: FALSE (private rakhna)

-- ============================================
-- Sample data test ke liye (optional)
-- ============================================
INSERT INTO products (name, description, price, category, file_url, thumbnail_url) VALUES
(
  'QR Se Print System',
  'Complete print shop automation system. Customer QR scan karke print order de sakta hai. Node.js + Razorpay integrated.',
  49900,
  'Software',
  'https://placeholder.com/file.zip',
  'https://via.placeholder.com/400x300/6366f1/white?text=QR+Print'
),
(
  'QR Se Resume Banao',
  'Resume builder with QR code. 6 professional templates, Razorpay payment, PDF download.',
  39900,
  'Software', 
  'https://placeholder.com/file.zip',
  'https://via.placeholder.com/400x300/8b5cf6/white?text=QR+Resume'
),
(
  'QR Wedding Card System',
  'Digital wedding invitation with QR code RSVP system. Beautiful templates included.',
  29900,
  'Software',
  'https://placeholder.com/file.zip',
  'https://via.placeholder.com/400x300/ec4899/white?text=Wedding+Card'
);
