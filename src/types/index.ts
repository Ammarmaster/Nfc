export type BusinessCategory = 
  | 'Restaurant'
  | 'Cafe'
  | 'Hotel'
  | 'Bakery'
  | 'Salon'
  | 'Retail'
  | 'Other';

export interface Business {
  id: string;
  name: string;
  category: BusinessCategory;
  ownerName?: string;
  contactPhone?: string;
  contactEmail?: string;
  logoUrl?: string;
  brandColor?: string;
  address?: string;
  googlePlaceId?: string;
  googleReviewUrl?: string; // e.g. https://search.google.com/local/writereview?placeid=ChIJ...
  digitalMenuUrl?: string;
  websiteUrl?: string;
  instagramUrl?: string;
  whatsappUrl?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export type DestinationType = 'REVIEW' | 'MENU_HOSTED' | 'MENU_EXTERNAL' | 'CUSTOM_URL' | 'MULTI_LINK';

export type NFCStatus = 'PENDING' | 'PROGRAMMED' | 'VERIFIED' | 'FAILED';

export interface Stand {
  id: string;
  slug: string; // Permanent URL slug: e.g. "01", "02", "50"
  standNumber: number;
  customLabel?: string; // e.g. "Table 01", "Bar Counter"
  businessId?: string | null;
  businessName?: string;
  destinationType: DestinationType;
  destinationUrlOverride?: string;
  isActive: boolean;
  isArchived: boolean;
  nfcTagUid?: string; // e.g. 04:9A:2F:5B:78
  nfcProgrammedStatus: NFCStatus;
  nfcTestedAt?: string;
  nfcNotes?: string;
  visitCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface MenuCategory {
  id: string;
  businessId: string;
  name: string;
  displayOrder: number;
  isActive: boolean;
  createdAt: string;
}

export interface MenuItem {
  id: string;
  categoryId: string;
  businessId: string;
  name: string;
  description?: string;
  price: number; // in INR ₹
  isVeg: boolean; // true = Veg, false = Non-Veg
  isSpicy?: boolean;
  isAvailable: boolean;
  imageUrl?: string;
  tags?: string[];
  displayOrder: number;
  createdAt: string;
}

export type DeviceCategory = 'MOBILE_IOS' | 'MOBILE_ANDROID' | 'DESKTOP' | 'OTHER';
export type ScanSource = 'QR' | 'NFC';

export interface AnalyticsEvent {
  id: string;
  standId: string;
  slug: string;
  businessId?: string | null;
  businessName?: string;
  destinationType: DestinationType;
  destinationUrl: string;
  source: ScanSource;
  deviceCategory: DeviceCategory;
  referrer?: string;
  createdAt: string;
}

export interface AuditLog {
  id: string;
  standId: string;
  businessId?: string;
  action: 'CREATED' | 'ASSIGNED' | 'UNASSIGNED' | 'DESTINATION_CHANGED' | 'ACTIVATED' | 'DEACTIVATED' | 'ARCHIVED';
  details: string;
  createdAt: string;
}

export interface BulkGenerateOptions {
  quantity: number;
  startNumber: number;
  endNumber: number;
  prefix: string;
  suffix: string;
  padDigits: number; // 0 for unpadded (1..50), 2 for 01..50, 3 for 001..50
  destinationType: DestinationType;
  businessId?: string;
  customLabelTemplate: string; // e.g. "Table {n}"
  qrFgColor: string;
  qrBgColor: string;
  errorCorrectionLevel: 'L' | 'M' | 'Q' | 'H';
  logoDataUrl?: string;
}

export interface PrintLayoutOptions {
  paperSize: 'A4' | 'Letter';
  columns: number;
  rows: number;
  marginMm: number;
  showStandId: boolean;
  showInstruction: boolean;
  showBusinessName: boolean;
  instructionText: string;
  showCutLines: boolean;
}

export interface AIConfig {
  provider: 'gemini' | 'openai' | 'template';
  apiKey: string;
  model: string;
  defaultTone: 'warm' | 'enthusiastic' | 'professional' | 'brief';
  maxDrafts: number;
  enableNoKeyFallback: boolean;
  customDomain: string;
}
