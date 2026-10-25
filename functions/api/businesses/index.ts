// Cloudflare Pages Function: /api/businesses
// Manages business client records in Cloudflare D1.

interface Env {
  DB: D1Database;
}

export const onRequestGet: PagesFunction<Env> = async (context) => {
  const { env } = context;

  try {
    const query = `
      SELECT 
        id,
        name,
        category,
        owner_name AS ownerName,
        contact_phone AS contactPhone,
        contact_email AS contactEmail,
        logo_url AS logoUrl,
        brand_color AS brandColor,
        address,
        google_place_id AS googlePlaceId,
        google_review_url AS googleReviewUrl,
        digital_menu_url AS digitalMenuUrl,
        website_url AS websiteUrl,
        instagram_url AS instagramUrl,
        whatsapp_url AS whatsappUrl,
        is_active AS isActive,
        created_at AS createdAt,
        updated_at AS updatedAt
      FROM businesses
      ORDER BY created_at DESC
    `;

    const { results } = await env.DB.prepare(query).all();

    const businesses = (results || []).map((r: any) => ({
      ...r,
      isActive: Boolean(r.isActive),
    }));

    return new Response(JSON.stringify(businesses), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message || 'Failed to fetch businesses' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};

export const onRequestPost: PagesFunction<Env> = async (context) => {
  const { request, env } = context;

  try {
    const b: any = await request.json();
    const id = b.id || `biz_${Date.now()}`;
    const now = new Date().toISOString();

    const stmt = env.DB.prepare(`
      INSERT INTO businesses (
        id, name, category, owner_name, contact_phone, contact_email,
        logo_url, brand_color, address, google_place_id, google_review_url,
        digital_menu_url, website_url, instagram_url, whatsapp_url, is_active, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        name = excluded.name,
        category = excluded.category,
        owner_name = excluded.owner_name,
        contact_phone = excluded.contact_phone,
        contact_email = excluded.contact_email,
        logo_url = excluded.logo_url,
        brand_color = excluded.brand_color,
        address = excluded.address,
        google_place_id = excluded.google_place_id,
        google_review_url = excluded.google_review_url,
        digital_menu_url = excluded.digital_menu_url,
        website_url = excluded.website_url,
        instagram_url = excluded.instagram_url,
        whatsapp_url = excluded.whatsapp_url,
        is_active = excluded.is_active,
        updated_at = excluded.updated_at
    `).bind(
      id,
      b.name,
      b.category || 'Restaurant',
      b.ownerName || null,
      b.contactPhone || null,
      b.contactEmail || null,
      b.logoUrl || null,
      b.brandColor || '#059669',
      b.address || null,
      b.googlePlaceId || null,
      b.googleReviewUrl || null,
      b.digitalMenuUrl || null,
      b.websiteUrl || null,
      b.instagramUrl || null,
      b.whatsappUrl || null,
      b.isActive !== false ? 1 : 0,
      now,
      now
    );

    await stmt.run();

    return new Response(JSON.stringify({ success: true, id }), {
      status: 201,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message || 'Failed to save business' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
