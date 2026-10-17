import { db } from './db';
import type { Stand, Business, MenuCategory, MenuItem, AnalyticsEvent, BulkGenerateOptions, AIConfig } from '../types';

export const api = {
  // --- Stands ---
  getStands: async (): Promise<Stand[]> => {
    try {
      const res = await fetch('/api/stands');
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) return data;
      }
    } catch {
      // In local dev without Cloudflare Functions runtime proxy, fallback to persistent local DB
    }
    return db.getStands().filter(s => !s.isArchived);
  },

  getStandBySlug: async (slug: string): Promise<Stand | undefined> => {
    try {
      const res = await fetch('/api/stands');
      if (res.ok) {
        const list: Stand[] = await res.json();
        const found = list.find(s => s.slug.toLowerCase() === slug.trim().toLowerCase());
        if (found) return found;
      }
    } catch {
      // Fallback
    }
    return db.getStandBySlug(slug);
  },

  saveStand: async (stand: Stand): Promise<Stand> => {
    try {
      const res = await fetch(`/api/stands/${stand.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(stand),
      });
      if (res.ok) {
        db.saveStand(stand);
        return stand;
      }
    } catch {
      // Fallback
    }
    return db.saveStand(stand);
  },

  bulkCreateStands: async (options: BulkGenerateOptions): Promise<{ created: Stand[]; skipped: string[] }> => {
    try {
      const res = await fetch('/api/stands/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(options),
      });
      if (res.ok) {
        const data = await res.json();
        // Sync local persistence
        for (const s of data.created || []) {
          db.saveStand(s);
        }
        return data;
      }
    } catch {
      // Fallback
    }
    return db.bulkCreateStands(options);
  },

  bulkUpdateStands: async (standIds: string[], updates: Partial<Stand>): Promise<number> => {
    return db.bulkUpdateStands(standIds, updates);
  },

  archiveStand: async (id: string): Promise<void> => {
    try {
      await fetch(`/api/stands/${id}`, { method: 'DELETE' });
    } catch {
      // Fallback
    }
    return db.archiveStand(id);
  },

  // --- Businesses ---
  getBusinesses: async (): Promise<Business[]> => {
    try {
      const res = await fetch('/api/businesses');
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) return data;
      }
    } catch {
      // Fallback
    }
    return db.getBusinesses();
  },

  getBusinessById: async (id: string): Promise<Business | undefined> => {
    try {
      const res = await fetch('/api/businesses');
      if (res.ok) {
        const list: Business[] = await res.json();
        const found = list.find(b => b.id === id);
        if (found) return found;
      }
    } catch {
      // Fallback
    }
    return db.getBusiness(id);
  },

  saveBusiness: async (business: Business): Promise<Business> => {
    try {
      const res = await fetch('/api/businesses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(business),
      });
      if (res.ok) {
        db.saveBusiness(business);
        return business;
      }
    } catch {
      // Fallback
    }
    return db.saveBusiness(business);
  },

  deleteBusiness: async (id: string): Promise<void> => {
    try {
      await fetch(`/api/businesses/${id}`, { method: 'DELETE' });
    } catch {
      // Fallback
    }
    return db.deleteBusiness(id);
  },

  // --- Digital Menu ---
  getMenuCategories: async (businessId: string): Promise<MenuCategory[]> => {
    try {
      const res = await fetch(`/api/menu?businessId=${encodeURIComponent(businessId)}`);
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.categories)) return data.categories;
      }
    } catch {
      // Fallback
    }
    return db.getMenuCategories(businessId);
  },

  saveMenuCategory: async (category: MenuCategory): Promise<MenuCategory> => {
    try {
      const res = await fetch('/api/menu', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'category', ...category }),
      });
      if (res.ok) {
        db.saveMenuCategory(category);
        return category;
      }
    } catch {
      // Fallback
    }
    return db.saveMenuCategory(category);
  },

  deleteMenuCategory: async (id: string): Promise<void> => {
    try {
      await fetch(`/api/menu?type=category&id=${encodeURIComponent(id)}`, { method: 'DELETE' });
    } catch {
      // Fallback
    }
    return db.deleteMenuCategory(id);
  },

  getMenuItems: async (businessId: string): Promise<MenuItem[]> => {
    try {
      const res = await fetch(`/api/menu?businessId=${encodeURIComponent(businessId)}`);
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.items)) return data.items;
      }
    } catch {
      // Fallback
    }
    return db.getMenuItems(businessId);
  },

  saveMenuItem: async (item: MenuItem): Promise<MenuItem> => {
    try {
      const res = await fetch('/api/menu', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'item', ...item }),
      });
      if (res.ok) {
        db.saveMenuItem(item);
        return item;
      }
    } catch {
      // Fallback
    }
    return db.saveMenuItem(item);
  },

  deleteMenuItem: async (id: string): Promise<void> => {
    try {
      await fetch(`/api/menu?type=item&id=${encodeURIComponent(id)}`, { method: 'DELETE' });
    } catch {
      // Fallback
    }
    return db.deleteMenuItem(id);
  },

  // --- Analytics ---
  getAnalytics: async (): Promise<AnalyticsEvent[]> => {
    try {
      const res = await fetch('/api/analytics');
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.events)) return data.events;
      }
    } catch {
      // Fallback
    }
    return db.getAnalytics();
  },

  logScanEvent: async (event: Omit<AnalyticsEvent, 'id' | 'createdAt'>): Promise<AnalyticsEvent> => {
    return db.logScanEvent(event);
  },

  getAuditLogs: async () => {
    return db.getAuditLogs();
  },

  // --- Settings ---
  getSettings: async (): Promise<AIConfig> => {
    return db.getSettings();
  },

  saveSettings: async (settings: AIConfig): Promise<void> => {
    return db.saveSettings(settings);
  },

  resetAllData: async (): Promise<void> => {
    return db.resetToFactoryDefaults();
  },

  // --- AI Review Draft Generator ---
  generateReviewDrafts: async (params: {
    businessName: string;
    category: string;
    experienceTags: string[];
    customerNotes?: string;
    tone?: 'warm' | 'enthusiastic' | 'professional' | 'brief';
  }): Promise<{ drafts: string[]; source: 'ai' | 'template' }> => {
    const settings = db.getSettings();

    // 1. If serverless backend endpoint is available, try it first
    try {
      const res = await fetch('/api/ai/draft', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.drafts && data.drafts.length > 0) {
          return data;
        }
      }
    } catch {
      // In local dev without Cloudflare worker runtime, fallback to direct client adapter
    }

    // 2. Direct Gemini call if user configured API key
    if (settings.apiKey && settings.provider === 'gemini') {
      try {
        const prompt = `You are a helpful assistant helping a customer draft an authentic Google Review for "${params.businessName}" (${params.category || 'Local Business'}).
STRICT GROUNDING RULES:
1. ONLY use facts and impressions explicitly provided by the customer.
2. DO NOT invent dishes, services, claims, or events not mentioned.
3. Tone: ${params.tone || 'warm'}.
4. Indian hospitality context: Natural, courteous, polite, and genuine.

Customer selected highlights: ${params.experienceTags.length > 0 ? params.experienceTags.join(', ') : 'Positive visit'}
Customer notes: ${params.customerNotes || 'None provided'}

Provide 3 distinct review drafts (one short & punchy, one balanced, one detailed).
Format as JSON array of 3 strings: ["draft1", "draft2", "draft3"]. Output valid JSON only without markdown.`;

        const res = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${settings.model || 'gemini-1.5-flash'}:generateContent?key=${settings.apiKey}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [{ parts: [{ text: prompt }] }],
              generationConfig: { temperature: 0.7, maxOutputTokens: 500 }
            })
          }
        );

        if (res.ok) {
          const geminiData = await res.json();
          const text = geminiData?.candidates?.[0]?.content?.parts?.[0]?.text;
          if (text) {
            const cleaned = text.replace(/```json/g, '').replace(/```/g, '').trim();
            const parsed = JSON.parse(cleaned);
            if (Array.isArray(parsed) && parsed.length > 0) {
              return { drafts: parsed, source: 'ai' };
            }
          }
        }
      } catch (err) {
        console.warn('Direct Gemini call failed, falling back to deterministic template engine:', err);
      }
    }

    // 3. High-quality deterministic template engine (No API Key Required, 100% Free, Strictly Grounded)
    const highlights = params.experienceTags.length > 0 
      ? params.experienceTags.join(' and ') 
      : 'pleasant visit';
    const notesSuffix = params.customerNotes?.trim() 
      ? ` In particular, ${params.customerNotes.trim()}.` 
      : '';
    const biz = params.businessName;
    const tone = params.tone || 'warm';

    if (tone === 'brief') {
      return {
        source: 'template',
        drafts: [
          `Had a wonderful visit at ${biz}. Really appreciated the ${highlights.toLowerCase()}!${notesSuffix}`,
          `Great experience at ${biz} today. The ${highlights.toLowerCase()} stood out.${notesSuffix} Highly recommended!`,
          `Very solid visit to ${biz}. Standout aspects were the ${highlights.toLowerCase()}.${notesSuffix}`,
        ],
      };
    }

    if (tone === 'enthusiastic') {
      return {
        source: 'template',
        drafts: [
          `Had an extraordinary experience at ${biz}! The ${highlights.toLowerCase()} really blew us away.${notesSuffix} Outstanding hospitality!`,
          `Cannot recommend ${biz} enough! Truly wonderful ${highlights.toLowerCase()} made our visit unforgettable.${notesSuffix} Will be visiting again soon!`,
          `Top-notch experience from start to finish at ${biz}! The ${highlights.toLowerCase()} exceeded our expectations.${notesSuffix} Huge compliments to the team!`,
        ],
      };
    }

    if (tone === 'professional') {
      return {
        source: 'template',
        drafts: [
          `Visiting ${biz} was a thoroughly positive experience. I was particularly impressed with the ${highlights.toLowerCase()}.${notesSuffix} The team maintains commendable standards.`,
          `High standard of service and attention to detail at ${biz}. Appreciated the ${highlights.toLowerCase()}.${notesSuffix} Consistently well managed.`,
          `Very satisfactory experience at ${biz}. The ${highlights.toLowerCase()} were delivered with genuine quality and care.${notesSuffix}`,
        ],
      };
    }

    // Default warm tone
    return {
      source: 'template',
      drafts: [
        `Had a truly pleasant visit to ${biz}. The ${highlights.toLowerCase()} made our time there very enjoyable.${notesSuffix} Thank you to the team!`,
        `Really appreciated our experience at ${biz}! The ${highlights.toLowerCase()} was lovely.${notesSuffix} Definitely a place worth visiting.`,
        `Such a delightful time at ${biz}. We were very happy with the ${highlights.toLowerCase()}.${notesSuffix} Looking forward to our next visit!`,
      ],
    };
  },
};
