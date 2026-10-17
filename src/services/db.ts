import type { Business, Stand, MenuCategory, MenuItem, AnalyticsEvent, AuditLog, AIConfig, BulkGenerateOptions } from '../types';

const STORAGE_KEYS = {
  BUSINESSES: 'tapreview_businesses_prod',
  STANDS: 'tapreview_stands_prod',
  MENU_CATEGORIES: 'tapreview_menu_categories_prod',
  MENU_ITEMS: 'tapreview_menu_items_prod',
  ANALYTICS: 'tapreview_analytics_prod',
  AUDIT_LOGS: 'tapreview_audit_logs_prod',
  SETTINGS: 'tapreview_settings_prod',
};

// Production App & AI Configuration Defaults
export const DEFAULT_SETTINGS: AIConfig = {
  provider: 'template',
  apiKey: '',
  model: 'gemini-1.5-flash',
  defaultTone: 'warm',
  maxDrafts: 3,
  enableNoKeyFallback: true,
  customDomain: 'tapreview.in',
};

// Database Layer Class (No hardcoded mock records; clean production persistence)
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
    // Only initialize settings if not present; no fake seed data injected
    if (!localStorage.getItem(STORAGE_KEYS.SETTINGS)) {
      this.set(STORAGE_KEYS.SETTINGS, DEFAULT_SETTINGS);
    }
  }

  // --- Businesses ---
  public getBusinesses(): Business[] {
    return this.get<Business[]>(STORAGE_KEYS.BUSINESSES, []);
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

    // Safely unassign associated stands rather than destroying permanent physical hardware records
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
    return this.get<Stand[]>(STORAGE_KEYS.STANDS, []);
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
    return this.get<MenuCategory[]>(STORAGE_KEYS.MENU_CATEGORIES, [])
      .filter(c => c.businessId === businessId)
      .sort((a, b) => a.displayOrder - b.displayOrder);
  }

  public saveMenuCategory(category: MenuCategory): MenuCategory {
    const list = this.get<MenuCategory[]>(STORAGE_KEYS.MENU_CATEGORIES, []);
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
    const list = this.get<MenuCategory[]>(STORAGE_KEYS.MENU_CATEGORIES, []).filter(c => c.id !== id);
    this.set(STORAGE_KEYS.MENU_CATEGORIES, list);

    const items = this.get<MenuItem[]>(STORAGE_KEYS.MENU_ITEMS, []).filter(i => i.categoryId !== id);
    this.set(STORAGE_KEYS.MENU_ITEMS, items);
  }

  public getMenuItems(businessId: string): MenuItem[] {
    return this.get<MenuItem[]>(STORAGE_KEYS.MENU_ITEMS, [])
      .filter(i => i.businessId === businessId)
      .sort((a, b) => a.displayOrder - b.displayOrder);
  }

  public saveMenuItem(item: MenuItem): MenuItem {
    const list = this.get<MenuItem[]>(STORAGE_KEYS.MENU_ITEMS, []);
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
    const list = this.get<MenuItem[]>(STORAGE_KEYS.MENU_ITEMS, []).filter(i => i.id !== id);
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

    // Increment real stand visit count
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
