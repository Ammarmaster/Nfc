-- Cloudflare D1 Migration: TapReview Core Schema
-- Run with: npx wrangler d1 migrations apply tapreview-db --local (or --remote)

-- 1. Businesses Table
CREATE TABLE IF NOT EXISTS businesses (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    category TEXT NOT NULL DEFAULT 'Restaurant', -- Restaurant, Cafe, Hotel, Bakery, Salon, Retail, Other
    owner_name TEXT,
    contact_phone TEXT,
    contact_email TEXT,
    logo_url TEXT,
    brand_color TEXT DEFAULT '#059669',
    address TEXT,
    google_place_id TEXT,
    google_review_url TEXT,
    digital_menu_url TEXT,
    website_url TEXT,
    is_active INTEGER NOT NULL DEFAULT 1,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- 2. Stands (QR + NFC Stands) Table
CREATE TABLE IF NOT EXISTS stands (
    id TEXT PRIMARY KEY,
    slug TEXT NOT NULL UNIQUE, -- Permanent URL component: e.g. '01', '02', '50' -> /r/01
    stand_number INTEGER NOT NULL,
    custom_label TEXT, -- e.g. "Table 01", "Billing Counter"
    business_id TEXT, -- Foreign key referencing businesses(id)
    destination_type TEXT NOT NULL DEFAULT 'REVIEW', -- REVIEW, MENU_HOSTED, MENU_EXTERNAL, CUSTOM_URL
    destination_url_override TEXT, -- Stand-specific override
    is_active INTEGER NOT NULL DEFAULT 1,
    is_archived INTEGER NOT NULL DEFAULT 0,
    nfc_tag_uid TEXT, -- Physical NFC Chip serial/UID e.g. 04:A2:4B:91:2E
    nfc_programmed_status TEXT NOT NULL DEFAULT 'PENDING', -- PENDING, PROGRAMMED, VERIFIED, FAILED
    nfc_tested_at TEXT,
    nfc_notes TEXT,
    visit_count INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (business_id) REFERENCES businesses(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_stands_slug ON stands(slug);
CREATE INDEX IF NOT EXISTS idx_stands_business_id ON stands(business_id);
CREATE INDEX IF NOT EXISTS idx_stands_status ON stands(is_active, is_archived);

-- 3. Digital Menu Categories
CREATE TABLE IF NOT EXISTS menu_categories (
    id TEXT PRIMARY KEY,
    business_id TEXT NOT NULL,
    name TEXT NOT NULL,
    display_order INTEGER NOT NULL DEFAULT 0,
    is_active INTEGER NOT NULL DEFAULT 1,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (business_id) REFERENCES businesses(id) ON DELETE CASCADE
);

-- 4. Digital Menu Items
CREATE TABLE IF NOT EXISTS menu_items (
    id TEXT PRIMARY KEY,
    category_id TEXT NOT NULL,
    business_id TEXT NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    price REAL NOT NULL DEFAULT 0.0, -- In INR (₹)
    is_veg INTEGER NOT NULL DEFAULT 1, -- 1 = Veg (Green dot), 0 = Non-Veg (Red dot)
    is_spicy INTEGER NOT NULL DEFAULT 0,
    is_available INTEGER NOT NULL DEFAULT 1,
    image_url TEXT,
    tags TEXT, -- JSON array of tags e.g. ["Bestseller", "Chef Special"]
    display_order INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (category_id) REFERENCES menu_categories(id) ON DELETE CASCADE,
    FOREIGN KEY (business_id) REFERENCES businesses(id) ON DELETE CASCADE
);

-- 5. Privacy-Conscious Analytics Events
CREATE TABLE IF NOT EXISTS analytics_events (
    id TEXT PRIMARY KEY,
    stand_id TEXT NOT NULL,
    slug TEXT NOT NULL,
    business_id TEXT,
    destination_type TEXT NOT NULL,
    destination_url TEXT NOT NULL,
    source TEXT NOT NULL DEFAULT 'QR', -- 'QR' or 'NFC' (via ?nfc=1 signal)
    device_category TEXT NOT NULL DEFAULT 'MOBILE_ANDROID', -- 'MOBILE_IOS', 'MOBILE_ANDROID', 'DESKTOP', 'OTHER'
    referrer TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (stand_id) REFERENCES stands(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_analytics_stand_id ON analytics_events(stand_id);
CREATE INDEX IF NOT EXISTS idx_analytics_created_at ON analytics_events(created_at);

-- 6. Stand Audit History
CREATE TABLE IF NOT EXISTS audit_logs (
    id TEXT PRIMARY KEY,
    stand_id TEXT NOT NULL,
    business_id TEXT,
    action TEXT NOT NULL, -- 'CREATED', 'ASSIGNED', 'DESTINATION_CHANGED', 'ACTIVATED', 'DEACTIVATED', 'ARCHIVED'
    details TEXT, -- JSON description of changes
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
