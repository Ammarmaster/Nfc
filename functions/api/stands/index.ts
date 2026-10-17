// Cloudflare Pages Function: /api/stands
// Manages stand inventory querying and single stand creation in Cloudflare D1.

interface Env {
  DB: D1Database;
}

export const onRequestGet: PagesFunction<Env> = async (context) => {
  const { env } = context;

  try {
    const query = `
      SELECT 
        s.id,
        s.slug,
        s.stand_number AS standNumber,
        s.custom_label AS customLabel,
        s.business_id AS businessId,
        b.name AS businessName,
        s.destination_type AS destinationType,
        s.destination_url_override AS destinationUrlOverride,
        s.is_active AS isActive,
        s.is_archived AS isArchived,
        s.nfc_tag_uid AS nfcTagUid,
        s.nfc_programmed_status AS nfcProgrammedStatus,
        s.nfc_tested_at AS nfcTestedAt,
        s.nfc_notes AS nfcNotes,
        s.visit_count AS visitCount,
        s.created_at AS createdAt,
        s.updated_at AS updatedAt
      FROM stands s
      LEFT JOIN businesses b ON s.business_id = b.id
      WHERE s.is_archived = 0
      ORDER BY s.stand_number ASC
    `;

    const { results } = await env.DB.prepare(query).all();

    // Map boolean flags from SQLite integers (1/0)
    const stands = (results || []).map((r: any) => ({
      ...r,
      isActive: Boolean(r.isActive),
      isArchived: Boolean(r.isArchived),
      visitCount: Number(r.visitCount || 0),
    }));

    return new Response(JSON.stringify(stands), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message || 'Database query failed' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};

export const onRequestPost: PagesFunction<Env> = async (context) => {
  const { request, env } = context;

  try {
    const stand: any = await request.json();
    const id = stand.id || `std_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const now = new Date().toISOString();

    const stmt = env.DB.prepare(`
      INSERT INTO stands (
        id, slug, stand_number, custom_label, business_id,
        destination_type, destination_url_override, is_active, is_archived,
        nfc_tag_uid, nfc_programmed_status, visit_count, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      id,
      stand.slug,
      stand.standNumber || 1,
      stand.customLabel || null,
      stand.businessId || null,
      stand.destinationType || 'REVIEW',
      stand.destinationUrlOverride || null,
      stand.isActive !== false ? 1 : 0,
      0,
      stand.nfcTagUid || null,
      stand.nfcProgrammedStatus || 'PENDING',
      0,
      now,
      now
    );

    await stmt.run();

    return new Response(JSON.stringify({ success: true, id }), {
      status: 201,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message || 'Failed to insert stand' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
