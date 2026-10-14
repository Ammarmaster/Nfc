import type { Business, Stand, MenuCategory, MenuItem, AnalyticsEvent, AuditLog, AIConfig, BulkGenerateOptions } from '../types';

const STORAGE_KEYS = {
  BUSINESSES: 'tapreview_businesses_v1',
  STANDS: 'tapreview_stands_v1',
  MENU_CATEGORIES: 'tapreview_menu_categories_v1',
  MENU_ITEMS: 'tapreview_menu_items_v1',
  ANALYTICS: 'tapreview_analytics_v1',
  AUDIT_LOGS: 'tapreview_audit_logs_v1',
  SETTINGS: 'tapreview_settings_v1',
};

// Default AI & App Settings
export const DEFAULT_SETTINGS: AIConfig = {
  provider: 'template',
  apiKey: '',
  model: 'gemini-1.5-flash',
  defaultTone: 'warm',
  maxDrafts: 3,
  enableNoKeyFallback: true,
  customDomain: 'tapreview.in',
};

// Initial Seed Data for Instant Realistic SaaS Experience
const INITIAL_BUSINESSES: Business[] = [
  {
    id: 'biz_01',
    name: 'Spice Route Biryani & Kebabs',
    category: 'Restaurant',
    ownerName: 'Chef Vikram Malhotra',
    contactPhone: '+91 98201 12345',
    contactEmail: 'contact@spiceroutebiryani.in',
    logoUrl: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=160&auto=format&fit=crop&q=80',
    brandColor: '#059669',
    address: 'Cyber Hub, DLF Phase 2, Gurugram, Haryana 122002',
    googlePlaceId: 'ChIJ_spice_route_gurugram',
    googleReviewUrl: 'https://search.google.com/local/writereview?placeid=ChIJ_spice_route_gurugram',
    digitalMenuUrl: 'https://spiceroute.in/menu',
    websiteUrl: 'https://spiceroutebiryani.in',
    isActive: true,
    createdAt: '2024-01-10T10:00:00.000Z',
    updatedAt: '2024-01-10T10:00:00.000Z',
  },
  {
    id: 'biz_02',
    name: 'Chai Point Artisans & Cafe',
    category: 'Cafe',
    ownerName: 'Priya Sundaram',
    contactPhone: '+91 98450 67890',
    contactEmail: 'priya@chaipointartisans.com',
    logoUrl: 'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=160&auto=format&fit=crop&q=80',
    brandColor: '#d97706',
    address: '100 Feet Rd, Indiranagar, Bengaluru, Karnataka 560038',
    googlePlaceId: 'ChIJ_chai_point_blr',
    googleReviewUrl: 'https://search.google.com/local/writereview?placeid=ChIJ_chai_point_blr',
    digitalMenuUrl: 'https://chaipointartisans.com/menu',
    websiteUrl: 'https://chaipointartisans.com',
    isActive: true,
    createdAt: '2024-01-15T11:30:00.000Z',
    updatedAt: '2024-01-15T11:30:00.000Z',
  },
  {
    id: 'biz_03',
    name: 'The Grand Oberoi Heritage',
    category: 'Hotel',
    ownerName: 'Rajeev Singhania',
    contactPhone: '+91 22 6632 5757',
    contactEmail: 'concierge@grandoberoi.com',
    logoUrl: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=160&auto=format&fit=crop&q=80',
    brandColor: '#4f46e5',
    address: 'Apollo Bunder, Colaba, Mumbai, Maharashtra 400001',
    googlePlaceId: 'ChIJ_grand_oberoi_mumbai',
    googleReviewUrl: 'https://search.google.com/local/writereview?placeid=ChIJ_grand_oberoi_mumbai',
    websiteUrl: 'https://grandoberoi.com',
    isActive: true,
    createdAt: '2024-01-20T09:15:00.000Z',
    updatedAt: '2024-01-20T09:15:00.000Z',
  },
  {
    id: 'biz_04',
    name: 'Aura Luxury Salon & Spa',
    category: 'Salon',
    ownerName: 'Ananya Deshmukh',
    contactPhone: '+91 99100 45678',
    contactEmail: 'bookings@aurasalon.in',
    logoUrl: 'https://images.unsplash.com/photo-1560066984-138dadb4c035?w=160&auto=format&fit=crop&q=80',
    brandColor: '#ec4899',
    address: 'Road No. 36, Jubilee Hills, Hyderabad, Telangana 500033',
    googlePlaceId: 'ChIJ_aura_salon_hyd',
    googleReviewUrl: 'https://search.google.com/local/writereview?placeid=ChIJ_aura_salon_hyd',
    websiteUrl: 'https://aurasalon.in',
    isActive: true,
    createdAt: '2024-02-01T14:00:00.000Z',
    updatedAt: '2024-02-01T14:00:00.000Z',
  },
];

const INITIAL_STANDS: Stand[] = [
  {
    id: 'std_01',
    slug: '01',
    standNumber: 1,
    customLabel: 'Table 01 (Indoor AC)',
    businessId: 'biz_01',
    businessName: 'Spice Route Biryani & Kebabs',
    destinationType: 'REVIEW',
    isActive: true,
    isArchived: false,
    nfcTagUid: '04:8F:A1:3B:5D:20:80',
    nfcProgrammedStatus: 'VERIFIED',
    nfcTestedAt: '2024-02-10T10:30:00.000Z',
    visitCount: 142,
    createdAt: '2024-01-12T10:00:00.000Z',
    updatedAt: '2024-01-12T10:00:00.000Z',
  },
  {
    id: 'std_02',
    slug: '02',
    standNumber: 2,
    customLabel: 'Table 02 (Indoor AC)',
    businessId: 'biz_01',
    businessName: 'Spice Route Biryani & Kebabs',
    destinationType: 'REVIEW',
    isActive: true,
    isArchived: false,
    nfcTagUid: '04:8F:A1:3B:5D:20:81',
    nfcProgrammedStatus: 'VERIFIED',
    nfcTestedAt: '2024-02-10T10:35:00.000Z',
    visitCount: 128,
    createdAt: '2024-01-12T10:05:00.000Z',
    updatedAt: '2024-01-12T10:05:00.000Z',
  },
  {
    id: 'std_03',
    slug: '03',
    standNumber: 3,
    customLabel: 'Table 03 (Digital Menu)',
    businessId: 'biz_01',
    businessName: 'Spice Route Biryani & Kebabs',
    destinationType: 'MENU_HOSTED',
    isActive: true,
    isArchived: false,
    nfcTagUid: '04:8F:A1:3B:5D:20:82',
    nfcProgrammedStatus: 'PROGRAMMED',
    nfcTestedAt: '2024-02-10T10:40:00.000Z',
    visitCount: 89,
    createdAt: '2024-01-12T10:10:00.000Z',
    updatedAt: '2024-01-12T10:10:00.000Z',
  },
  {
    id: 'std_04',
    slug: '04',
    standNumber: 4,
    customLabel: 'Counter 01 (Billing)',
    businessId: 'biz_02',
    businessName: 'Chai Point Artisans & Cafe',
    destinationType: 'REVIEW',
    isActive: true,
    isArchived: false,
    nfcTagUid: '04:8F:A1:3B:5D:20:83',
    nfcProgrammedStatus: 'VERIFIED',
    nfcTestedAt: '2024-02-11T12:00:00.000Z',
    visitCount: 315,
    createdAt: '2024-01-16T12:00:00.000Z',
    updatedAt: '2024-01-16T12:00:00.000Z',
  },
  {
    id: 'std_05',
    slug: '05',
    standNumber: 5,
    customLabel: 'Outdoor Patio Table A',
    businessId: 'biz_02',
    businessName: 'Chai Point Artisans & Cafe',
    destinationType: 'MENU_HOSTED',
    isActive: true,
    isArchived: false,
    nfcTagUid: '04:8F:A1:3B:5D:20:84',
    nfcProgrammedStatus: 'VERIFIED',
    nfcTestedAt: '2024-02-11T12:15:00.000Z',
    visitCount: 94,
    createdAt: '2024-01-16T12:15:00.000Z',
    updatedAt: '2024-01-16T12:15:00.000Z',
  },
  {
    id: 'std_06',
    slug: '06',
    standNumber: 6,
    customLabel: 'Lobby Concierge Desk',
    businessId: 'biz_03',
    businessName: 'The Grand Oberoi Heritage',
    destinationType: 'REVIEW',
    isActive: true,
    isArchived: false,
    nfcTagUid: '04:8F:A1:3B:5D:20:85',
    nfcProgrammedStatus: 'VERIFIED',
    visitCount: 210,
    createdAt: '2024-01-22T14:00:00.000Z',
    updatedAt: '2024-01-22T14:00:00.000Z',
  },
  {
    id: 'std_07',
    slug: '07',
    standNumber: 7,
    customLabel: 'Styling Station 01',
    businessId: 'biz_04',
    businessName: 'Aura Luxury Salon & Spa',
    destinationType: 'REVIEW',
    isActive: true,
    isArchived: false,
    nfcTagUid: '04:8F:A1:3B:5D:20:86',
    nfcProgrammedStatus: 'PROGRAMMED',
    visitCount: 78,
    createdAt: '2024-02-02T16:00:00.000Z',
    updatedAt: '2024-02-02T16:00:00.000Z',
  },
  {
    id: 'std_08',
    slug: '08',
    standNumber: 8,
    customLabel: 'Stock Stand #08',
    businessId: null,
    businessName: undefined,
    destinationType: 'REVIEW',
    isActive: true,
    isArchived: false,
    nfcProgrammedStatus: 'PENDING',
    visitCount: 0,
    createdAt: '2024-02-15T09:00:00.000Z',
    updatedAt: '2024-02-15T09:00:00.000Z',
  },
  {
    id: 'std_09',
    slug: '09',
    standNumber: 9,
    customLabel: 'Stock Stand #09',
    businessId: null,
    businessName: undefined,
    destinationType: 'REVIEW',
    isActive: true,
    isArchived: false,
    nfcProgrammedStatus: 'PENDING',
    visitCount: 0,
    createdAt: '2024-02-15T09:00:00.000Z',
    updatedAt: '2024-02-15T09:00:00.000Z',
  },
  {
    id: 'std_10',
    slug: '10',
    standNumber: 10,
    customLabel: 'Temporary Test Stand (Disabled)',
    businessId: 'biz_01',
    businessName: 'Spice Route Biryani & Kebabs',
    destinationType: 'REVIEW',
    isActive: false, // Inactive example to test unavailable status page
    isArchived: false,
    nfcProgrammedStatus: 'FAILED',
    visitCount: 12,
    createdAt: '2024-02-15T09:10:00.000Z',
    updatedAt: '2024-02-15T09:10:00.000Z',
  },
];

const INITIAL_CATEGORIES: MenuCategory[] = [
  { id: 'cat_01', businessId: 'biz_01', name: 'Signature Kebabs & Starters', displayOrder: 1, isActive: true, createdAt: '2024-01-10T10:00:00.000Z' },
  { id: 'cat_02', businessId: 'biz_01', name: 'Dum Handi Biryanis', displayOrder: 2, isActive: true, createdAt: '2024-01-10T10:00:00.000Z' },
  { id: 'cat_03', businessId: 'biz_01', name: 'Curries & Breads', displayOrder: 3, isActive: true, createdAt: '2024-01-10T10:00:00.000Z' },
  { id: 'cat_04', businessId: 'biz_01', name: 'Desserts & Beverages', displayOrder: 4, isActive: true, createdAt: '2024-01-10T10:00:00.000Z' },
  { id: 'cat_05', businessId: 'biz_02', name: 'Specialty Teas & Chai', displayOrder: 1, isActive: true, createdAt: '2024-01-15T11:00:00.000Z' },
  { id: 'cat_06', businessId: 'biz_02', name: 'Fresh Bakes & Snacks', displayOrder: 2, isActive: true, createdAt: '2024-01-15T11:00:00.000Z' },
];

const INITIAL_ITEMS: MenuItem[] = [
  {
    id: 'itm_01',
    categoryId: 'cat_01',
    businessId: 'biz_01',
    name: 'Murgh Malai Reshmi Kebab',
    description: 'Tender chicken marinated in cardamom, cashew cream and royal cheese, flame-grilled over charcoal.',
    price: 395,
    isVeg: false,
    isSpicy: false,
    isAvailable: true,
    tags: ['Chef Special', 'Bestseller'],
    imageUrl: 'https://images.unsplash.com/photo-1599488615731-7e5c2823ff28?w=300&auto=format&fit=crop&q=80',
    displayOrder: 1,
    createdAt: '2024-01-10T10:00:00.000Z',
  },
  {
    id: 'itm_02',
    categoryId: 'cat_01',
    businessId: 'biz_01',
    name: 'Paneer Tikka Angara',
    description: 'Fresh farm cottage cheese infused with smoked Kashmiri chilies and ajwain, roasted to golden perfection.',
    price: 345,
    isVeg: true,
    isSpicy: true,
    isAvailable: true,
    tags: ['Popular'],
    imageUrl: 'https://images.unsplash.com/photo-1567188040759-fb8a883dc6d8?w=300&auto=format&fit=crop&q=80',
    displayOrder: 2,
    createdAt: '2024-01-10T10:00:00.000Z',
  },
  {
    id: 'itm_03',
    categoryId: 'cat_02',
    businessId: 'biz_01',
    name: 'Kachhi Gosht Dum Biryani',
    description: 'Traditional slow-cooked aged basmati rice layered with prime mutton cuts, whole spices, saffron and caramelized onions.',
    price: 540,
    isVeg: false,
    isSpicy: true,
    isAvailable: true,
    tags: ['Must Try', 'Signature'],
    imageUrl: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=300&auto=format&fit=crop&q=80',
    displayOrder: 1,
    createdAt: '2024-01-10T10:00:00.000Z',
  },
  {
    id: 'itm_04',
    categoryId: 'cat_02',
    businessId: 'biz_01',
    name: 'Subz Handi Dum Biryani',
    description: 'Garden vegetables, baby potatoes and aromatic long grain rice cooked in a sealed earthen pot.',
    price: 360,
    isVeg: true,
    isSpicy: false,
    isAvailable: true,
    tags: ['Veg Delight'],
    imageUrl: 'https://images.unsplash.com/photo-1589302168068-964664d93dc0?w=300&auto=format&fit=crop&q=80',
    displayOrder: 2,
    createdAt: '2024-01-10T10:00:00.000Z',
  },
  {
    id: 'itm_05',
    categoryId: 'cat_04',
    businessId: 'biz_01',
    name: 'Royal Saffron Phirni',
    description: 'Slow-chilled ground rice dessert infused with crushed green cardamom, saffron pistachios in clay bowl.',
    price: 180,
    isVeg: true,
    isSpicy: false,
    isAvailable: true,
    tags: ['Dessert'],
    displayOrder: 1,
    createdAt: '2024-01-10T10:00:00.000Z',
  },
  {
    id: 'itm_06',
    categoryId: 'cat_05',
    businessId: 'biz_02',
    name: 'Kadak Masala Chai (Kulhad)',
    description: 'Brewed Assam CTC with freshly crushed ginger, cardamom, and clove in an earthen clay cup.',
    price: 75,
    isVeg: true,
    isSpicy: false,
    isAvailable: true,
    tags: ['Bestseller'],
    displayOrder: 1,
    createdAt: '2024-01-15T11:00:00.000Z',
  },
  {
    id: 'itm_07',
    categoryId: 'cat_06',
    businessId: 'biz_02',
    name: 'Bun Maska with Jam',
    description: 'Toasted soft bakery bun loaded with Amul butter and mixed fruit preserve.',
    price: 85,
    isVeg: true,
    isSpicy: false,
    isAvailable: true,
    displayOrder: 1,
    createdAt: '2024-01-15T11:00:00.000Z',
  },
];

// Helper to generate seed analytics for the past 30 days
function generateSeedAnalytics(): AnalyticsEvent[] {
  const events: AnalyticsEvent[] = [];
  const now = Date.now();
  const dayMs = 24 * 60 * 60 * 1000;

  // Stored sample stands
  const samples = [
    { standId: 'std_01', slug: '01', businessId: 'biz_01', businessName: 'Spice Route Biryani & Kebabs', dest: 'REVIEW' as const },
    { standId: 'std_02', slug: '02', businessId: 'biz_01', businessName: 'Spice Route Biryani & Kebabs', dest: 'REVIEW' as const },
    { standId: 'std_03', slug: '03', businessId: 'biz_01', businessName: 'Spice Route Biryani & Kebabs', dest: 'MENU_HOSTED' as const },
    { standId: 'std_04', slug: '04', businessId: 'biz_02', businessName: 'Chai Point Artisans & Cafe', dest: 'REVIEW' as const },
    { standId: 'std_05', slug: '05', businessId: 'biz_02', businessName: 'Chai Point Artisans & Cafe', dest: 'MENU_HOSTED' as const },
    { standId: 'std_06', slug: '06', businessId: 'biz_03', businessName: 'The Grand Oberoi Heritage', dest: 'REVIEW' as const },
    { standId: 'std_07', slug: '07', businessId: 'biz_04', businessName: 'Aura Luxury Salon & Spa', dest: 'REVIEW' as const },
  ];

  for (let day = 30; day >= 0; day--) {
    const timestamp = new Date(now - day * dayMs).toISOString();
    // Daily volume random between 12 and 35 visits
    const dayCount = 12 + Math.floor(Math.random() * 24);
    for (let i = 0; i < dayCount; i++) {
      const stand = samples[Math.floor(Math.random() * samples.length)];
      const isNfc = Math.random() < 0.38; // 38% NFC taps, 62% QR scans
      const deviceRoll = Math.random();
      const deviceCategory = deviceRoll < 0.55 ? 'MOBILE_ANDROID' : deviceRoll < 0.90 ? 'MOBILE_IOS' : 'DESKTOP';

      events.push({
        id: `evt_${day}_${i}`,
        standId: stand.standId,
        slug: stand.slug,
        businessId: stand.businessId,
        businessName: stand.businessName,
        destinationType: stand.dest,
        destinationUrl: stand.dest === 'REVIEW' ? 'https://search.google.com/local/writereview' : 'MENU_HOSTED',
        source: isNfc ? 'NFC' : 'QR',
        deviceCategory,
        createdAt: timestamp,
      });
    }
  }

  return events;
}

// Database Layer Class
class LocalDatabase {
  private get<T>(key: string, defaultVal: T): T {
    try {
      const raw = localStorage.getItem(key);
      if (!raw) return defaultVal;
      return JSON.parse(raw);
    } catch {
      return defaultVal;
    }
  }

  private set<T>(key: string, val: T): void {
    try {
      localStorage.setItem(key, JSON.stringify(val));
    } catch (e) {
      console.error(`Failed to persist key: ${key}`, e);
    }
  }

  public init() {
    if (!localStorage.getItem(STORAGE_KEYS.BUSINESSES)) {
      this.set(STORAGE_KEYS.BUSINESSES, INITIAL_BUSINESSES);
    }
    if (!localStorage.getItem(STORAGE_KEYS.STANDS)) {
      this.set(STORAGE_KEYS.STANDS, INITIAL_STANDS);
    }
    if (!localStorage.getItem(STORAGE_KEYS.MENU_CATEGORIES)) {
      this.set(STORAGE_KEYS.MENU_CATEGORIES, INITIAL_CATEGORIES);
    }
    if (!localStorage.getItem(STORAGE_KEYS.MENU_ITEMS)) {
      this.set(STORAGE_KEYS.MENU_ITEMS, INITIAL_ITEMS);
    }
    if (!localStorage.getItem(STORAGE_KEYS.ANALYTICS)) {
      this.set(STORAGE_KEYS.ANALYTICS, generateSeedAnalytics());
    }
    if (!localStorage.getItem(STORAGE_KEYS.SETTINGS)) {
      this.set(STORAGE_KEYS.SETTINGS, DEFAULT_SETTINGS);
    }
    if (!localStorage.getItem(STORAGE_KEYS.AUDIT_LOGS)) {
      this.set(STORAGE_KEYS.AUDIT_LOGS, [
        {
          id: 'log_01',
          standId: 'std_01',
          businessId: 'biz_01',
          action: 'ASSIGNED',
          details: 'Assigned to Spice Route Biryani & Kebabs with Review destination',
          createdAt: '2024-01-12T10:00:00.000Z',
        }
      ]);
    }
  }

  // --- Businesses ---
  public getBusinesses(): Business[] {
    return this.get<Business[]>(STORAGE_KEYS.BUSINESSES, INITIAL_BUSINESSES);
  }

  public getBusiness(id: string): Business | undefined {
    return this.getBusinesses().find(b => b.id === id);
  }

  public saveBusiness(business: Business): Business {
    const list = this.getBusinesses();
    const index = list.findIndex(b => b.id === business.id);
    const now = new Date().toISOString();
    
    let updated: Business;
    if (index >= 0) {
      updated = { ...business, updatedAt: now };
      list[index] = updated;
    } else {
      updated = { ...business, createdAt: now, updatedAt: now };
      list.push(updated);
    }
    this.set(STORAGE_KEYS.BUSINESSES, list);

    // Cascade business updates to assigned stands' businessName
    const stands = this.getStands();
    let standsModified = false;
    for (const stand of stands) {
      if (stand.businessId === business.id) {
        stand.businessName = business.name;
        standsModified = true;
      }
    }
    if (standsModified) {
      this.set(STORAGE_KEYS.STANDS, stands);
    }

    return updated;
  }

  public deleteBusiness(id: string): void {
    const list = this.getBusinesses().filter(b => b.id !== id);
    this.set(STORAGE_KEYS.BUSINESSES, list);

    // Unassign associated stands rather than deleting permanent physical stands!
    const stands = this.getStands();
    for (const s of stands) {
      if (s.businessId === id) {
        s.businessId = null;
        s.businessName = undefined;
      }
    }
    this.set(STORAGE_KEYS.STANDS, stands);
  }

  // --- Stands ---
  public getStands(): Stand[] {
    return this.get<Stand[]>(STORAGE_KEYS.STANDS, INITIAL_STANDS);
  }

  public getStand(id: string): Stand | undefined {
    return this.getStands().find(s => s.id === id);
  }

  public getStandBySlug(slug: string): Stand | undefined {
    const cleanSlug = slug.trim().toLowerCase();
    return this.getStands().find(s => s.slug.toLowerCase() === cleanSlug && !s.isArchived);
  }

  public saveStand(stand: Stand): Stand {
    const list = this.getStands();
    const index = list.findIndex(s => s.id === stand.id);
    const now = new Date().toISOString();

    let updated: Stand;
    if (index >= 0) {
      updated = { ...stand, updatedAt: now };
      list[index] = updated;
      this.addAuditLog(stand.id, stand.businessId || undefined, 'DESTINATION_CHANGED', `Updated stand configuration for /r/${stand.slug}`);
    } else {
      updated = { ...stand, createdAt: now, updatedAt: now };
      list.push(updated);
      this.addAuditLog(stand.id, stand.businessId || undefined, 'CREATED', `Created stand /r/${stand.slug}`);
    }

    this.set(STORAGE_KEYS.STANDS, list);
    return updated;
  }

  public bulkCreateStands(options: BulkGenerateOptions): { created: Stand[]; skipped: string[] } {
    const list = this.getStands();
    const existingSlugs = new Set(list.map(s => s.slug.toLowerCase()));
    const created: Stand[] = [];
    const skipped: string[] = [];
    const now = new Date().toISOString();

    let business: Business | undefined;
    if (options.businessId) {
      business = this.getBusiness(options.businessId);
    }

    for (let n = options.startNumber; n <= options.endNumber; n++) {
      let numStr = n.toString();
      if (options.padDigits > 0) {
        numStr = numStr.padStart(options.padDigits, '0');
      }
      const slug = `${options.prefix}${numStr}${options.suffix}`.trim();

      if (existingSlugs.has(slug.toLowerCase())) {
        skipped.push(slug);
        continue;
      }

      const stand: Stand = {
        id: `std_${Date.now()}_${n}_${Math.random().toString(36).substring(2, 6)}`,
        slug,
        standNumber: n,
        customLabel: options.customLabelTemplate.replace('{n}', numStr),
        businessId: options.businessId || null,
        businessName: business?.name,
        destinationType: options.destinationType,
        isActive: true,
        isArchived: false,
        nfcProgrammedStatus: 'PENDING',
        visitCount: 0,
        createdAt: now,
        updatedAt: now,
      };

      list.push(stand);
      created.push(stand);
      existingSlugs.add(slug.toLowerCase());
    }

    this.set(STORAGE_KEYS.STANDS, list);
    return { created, skipped };
  }

  public bulkUpdateStands(standIds: string[], updates: Partial<Stand>): number {
    const list = this.getStands();
    let count = 0;
    const now = new Date().toISOString();

    for (const stand of list) {
      if (standIds.includes(stand.id)) {
        Object.assign(stand, updates, { updatedAt: now });
        count++;
      }
    }

    if (count > 0) {
      this.set(STORAGE_KEYS.STANDS, list);
    }
    return count;
  }

  public archiveStand(id: string): void {
    const list = this.getStands();
    const stand = list.find(s => s.id === id);
    if (stand) {
      stand.isArchived = true;
      stand.isActive = false;
      stand.updatedAt = new Date().toISOString();
      this.set(STORAGE_KEYS.STANDS, list);
      this.addAuditLog(id, stand.businessId || undefined, 'ARCHIVED', `Archived stand /r/${stand.slug}`);
    }
  }

  // --- Digital Menu ---
  public getMenuCategories(businessId: string): MenuCategory[] {
    return this.get<MenuCategory[]>(STORAGE_KEYS.MENU_CATEGORIES, INITIAL_CATEGORIES)
      .filter(c => c.businessId === businessId)
      .sort((a, b) => a.displayOrder - b.displayOrder);
  }

  public saveMenuCategory(category: MenuCategory): MenuCategory {
    const list = this.get<MenuCategory[]>(STORAGE_KEYS.MENU_CATEGORIES, INITIAL_CATEGORIES);
    const index = list.findIndex(c => c.id === category.id);
    if (index >= 0) {
      list[index] = category;
    } else {
      list.push(category);
    }
    this.set(STORAGE_KEYS.MENU_CATEGORIES, list);
    return category;
  }

  public deleteMenuCategory(id: string): void {
    const list = this.get<MenuCategory[]>(STORAGE_KEYS.MENU_CATEGORIES, INITIAL_CATEGORIES).filter(c => c.id !== id);
    this.set(STORAGE_KEYS.MENU_CATEGORIES, list);

    // Remove associated items
    const items = this.get<MenuItem[]>(STORAGE_KEYS.MENU_ITEMS, INITIAL_ITEMS).filter(i => i.categoryId !== id);
    this.set(STORAGE_KEYS.MENU_ITEMS, items);
  }

  public getMenuItems(businessId: string): MenuItem[] {
    return this.get<MenuItem[]>(STORAGE_KEYS.MENU_ITEMS, INITIAL_ITEMS)
      .filter(i => i.businessId === businessId)
      .sort((a, b) => a.displayOrder - b.displayOrder);
  }

  public saveMenuItem(item: MenuItem): MenuItem {
    const list = this.get<MenuItem[]>(STORAGE_KEYS.MENU_ITEMS, INITIAL_ITEMS);
    const index = list.findIndex(i => i.id === item.id);
    if (index >= 0) {
      list[index] = item;
    } else {
      list.push(item);
    }
    this.set(STORAGE_KEYS.MENU_ITEMS, list);
    return item;
  }

  public deleteMenuItem(id: string): void {
    const list = this.get<MenuItem[]>(STORAGE_KEYS.MENU_ITEMS, INITIAL_ITEMS).filter(i => i.id !== id);
    this.set(STORAGE_KEYS.MENU_ITEMS, list);
  }

  // --- Analytics ---
  public getAnalytics(): AnalyticsEvent[] {
    return this.get<AnalyticsEvent[]>(STORAGE_KEYS.ANALYTICS, []);
  }

  public logScanEvent(event: Omit<AnalyticsEvent, 'id' | 'createdAt'>): AnalyticsEvent {
    const list = this.getAnalytics();
    const newEvent: AnalyticsEvent = {
      ...event,
      id: `evt_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      createdAt: new Date().toISOString(),
    };
    list.push(newEvent);
    this.set(STORAGE_KEYS.ANALYTICS, list);

    // Increment stand visit count
    const stands = this.getStands();
    const stand = stands.find(s => s.id === event.standId);
    if (stand) {
      stand.visitCount = (stand.visitCount || 0) + 1;
      this.set(STORAGE_KEYS.STANDS, stands);
    }

    return newEvent;
  }

  // --- Audit Logs ---
  public getAuditLogs(): AuditLog[] {
    return this.get<AuditLog[]>(STORAGE_KEYS.AUDIT_LOGS, []);
  }

  public addAuditLog(standId: string, businessId: string | undefined, action: AuditLog['action'], details: string) {
    const logs = this.getAuditLogs();
    logs.unshift({
      id: `log_${Date.now()}`,
      standId,
      businessId,
      action,
      details,
      createdAt: new Date().toISOString(),
    });
    // Keep last 200 logs
    if (logs.length > 200) logs.pop();
    this.set(STORAGE_KEYS.AUDIT_LOGS, logs);
  }

  // --- Settings ---
  public getSettings(): AIConfig {
    return this.get<AIConfig>(STORAGE_KEYS.SETTINGS, DEFAULT_SETTINGS);
  }

  public saveSettings(settings: AIConfig): void {
    this.set(STORAGE_KEYS.SETTINGS, settings);
  }

  public resetToFactoryDefaults(): void {
    localStorage.clear();
    this.init();
  }
}

export const db = new LocalDatabase();
db.init();
