// Cloudflare Pages Function: /api/analytics
// Computes privacy-conscious aggregate scan analytics directly from Cloudflare D1.

interface Env {
  DB: D1Database;
}

export const onRequestGet: PagesFunction<Env> = async (context) => {
  const { env } = context;

  try {
    const [eventsRes, timelineRes, topStandsRes] = await Promise.all([
      // Total scan interactions with breakdown
      env.DB.prepare(`
        SELECT 
          id, stand_id AS standId, slug, business_id AS businessId,
          destination_type AS destinationType, destination_url AS destinationUrl,
          source, device_category AS deviceCategory, created_at AS createdAt
        FROM analytics_events
        ORDER BY created_at DESC
        LIMIT 500
      `).all(),

      // Daily timeline over last 14 days
      env.DB.prepare(`
        SELECT strftime('%m-%d', created_at) AS date, COUNT(*) AS count
        FROM analytics_events
        WHERE created_at >= datetime('now', '-14 days')
        GROUP BY strftime('%m-%d', created_at)
        ORDER BY created_at ASC
      `).all(),

      // Top stands by visit count
      env.DB.prepare(`
        SELECT id, slug, custom_label AS customLabel, visit_count AS visitCount
        FROM stands
        WHERE is_archived = 0
        ORDER BY visit_count DESC
        LIMIT 10
      `).all(),
    ]);

    return new Response(JSON.stringify({
      events: eventsRes.results || [],
      timeline: timelineRes.results || [],
      topStands: topStandsRes.results || [],
    }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message || 'Analytics query failed' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
