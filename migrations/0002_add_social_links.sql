-- Cloudflare D1 Migration: Add social links to businesses
ALTER TABLE businesses ADD COLUMN instagram_url TEXT;
ALTER TABLE businesses ADD COLUMN whatsapp_url TEXT;
