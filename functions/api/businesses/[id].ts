// Cloudflare Pages Function: /api/businesses/:id
// Handles business deletion and safely unlinks associated stands in Cloudflare D1.

interface Env {
  DB: D1Database;
}

export const onRequestDelete: PagesFunction<Env> = async (context) => {
  const { params, env } = context;
  const id = params.id as string;

  try {
    await env.DB.batch([
      // Unlink associated stands so permanent URLs remain functional
      env.DB.prepare('UPDATE stands SET business_id = NULL WHERE business_id = ?').bind(id),
      // Delete business record
      env.DB.prepare('DELETE FROM businesses WHERE id = ?').bind(id),
    ]);

    return new Response(JSON.stringify({ success: true, deleted: id }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message || 'Failed to delete business' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
