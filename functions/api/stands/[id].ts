// Cloudflare Pages Function: /api/stands/:id
// Handles updating and safe archiving of a specific stand in Cloudflare D1.

interface Env {
  DB: D1Database;
}

export const onRequestPut: PagesFunction<Env> = async (context) => {
  const { params, request, env } = context;
  const id = params.id as string;

  try {
    const updates: any = await request.json();
    const now = new Date().toISOString();

    const stmt = env.DB.prepare(`
      UPDATE stands SET
        custom_label = COALESCE(?, custom_label),
        business_id = ?,
        destination_type = COALESCE(?, destination_type),
        destination_url_override = ?,
        is_active = COALESCE(?, is_active),
        nfc_tag_uid = ?,
        nfc_programmed_status = COALESCE(?, nfc_programmed_status),
        nfc_tested_at = COALESCE(?, nfc_tested_at),
        updated_at = ?
      WHERE id = ?
    `).bind(
      updates.customLabel ?? null,
      updates.businessId ?? null,
      updates.destinationType ?? null,
      updates.destinationUrlOverride ?? null,
      updates.isActive !== undefined ? (updates.isActive ? 1 : 0) : null,
      updates.nfcTagUid ?? null,
      updates.nfcProgrammedStatus ?? null,
      updates.nfcTestedAt ?? null,
      now,
      id
    );

    await stmt.run();

    return new Response(JSON.stringify({ success: true, id }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message || 'Update failed' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};

export const onRequestDelete: PagesFunction<Env> = async (context) => {
  const { params, env } = context;
  const id = params.id as string;

  try {
    // Safe archival: do not destroy record so permanent URLs don't break unexpectedly
    const stmt = env.DB.prepare(`
      UPDATE stands SET is_archived = 1, is_active = 0, updated_at = datetime('now') WHERE id = ?
    `).bind(id);

    await stmt.run();

    return new Response(JSON.stringify({ success: true, archived: id }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message || 'Archival failed' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
