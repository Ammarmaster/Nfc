// Cloudflare Pages Function: /api/stands/bulk
// Transactional batch stand generation with atomic collision checks in Cloudflare D1.

interface Env {
  DB: D1Database;
}

interface BulkRequestBody {
  quantity: number;
  startNumber: number;
  endNumber: number;
  prefix: string;
  suffix: string;
  padDigits: number;
  destinationType: string;
  businessId?: string;
  customLabelTemplate: string;
}

export const onRequestPost: PagesFunction<Env> = async (context) => {
  const { request, env } = context;

  try {
    const body: BulkRequestBody = await request.json();
    const {
      quantity = 1,
      startNumber = 1,
      endNumber = 1,
      prefix = '',
      suffix = '',
      padDigits = 2,
      destinationType = 'REVIEW',
      businessId,
      customLabelTemplate = 'Stand #{n}',
    } = body;

    // 1. Fetch all existing slugs to prevent collisions
    const existing = await env.DB.prepare('SELECT slug FROM stands WHERE is_archived = 0').all();
    const existingSet = new Set((existing.results || []).map((r: any) => r.slug.toLowerCase()));

    const created: any[] = [];
    const skipped: string[] = [];
    const statements: D1PreparedStatement[] = [];
    const now = new Date().toISOString();

    for (let n = startNumber; n <= endNumber; n++) {
      let numStr = n.toString();
      if (padDigits > 0) {
        numStr = numStr.padStart(padDigits, '0');
      }
      const slug = `${prefix}${numStr}${suffix}`.trim();

      if (existingSet.has(slug.toLowerCase())) {
        skipped.push(slug);
        continue;
      }

      const id = `std_${Date.now()}_${n}_${Math.random().toString(36).substring(2, 6)}`;
      const label = customLabelTemplate.replace('{n}', numStr);

      const stmt = env.DB.prepare(`
        INSERT INTO stands (
          id, slug, stand_number, custom_label, business_id,
          destination_type, is_active, is_archived, nfc_programmed_status,
          visit_count, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, 1, 0, 'PENDING', 0, ?, ?)
      `).bind(
        id,
        slug,
        n,
        label,
        businessId || null,
        destinationType,
        now,
        now
      );

      statements.push(stmt);
      created.push({
        id,
        slug,
        standNumber: n,
        customLabel: label,
        businessId: businessId || null,
        destinationType,
        isActive: true,
        isArchived: false,
        nfcProgrammedStatus: 'PENDING',
        visitCount: 0,
        createdAt: now,
        updatedAt: now,
      });

      existingSet.add(slug.toLowerCase());
    }

    // 2. Execute atomic batch insertion in D1
    if (statements.length > 0) {
      await env.DB.batch(statements);
    }

    return new Response(JSON.stringify({ created, skipped }), {
      status: 201,
      headers: { 'Content-Type': 'application/json' },
    });

  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message || 'Batch creation failed' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
