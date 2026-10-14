// Cloudflare Pages Function: Public Permanent Route /r/:slug
// Resolves permanent NFC/QR slug, logs analytics, and directs to destination or landing page.

interface Env {
  DB: D1Database;
  APP_DOMAIN?: string;
}

export const onRequestGet: PagesFunction<Env> = async (context) => {
  const { params, request, env } = context;
  const slug = params.slug as string;
  const url = new URL(request.url);
  const isNfc = url.searchParams.get('nfc') === '1';
  const userAgent = request.headers.get('user-agent') || '';

  // Determine device category
  let deviceCategory = 'DESKTOP';
  if (/android/i.test(userAgent)) {
    deviceCategory = 'MOBILE_ANDROID';
  } else if (/iphone|ipad|ipod/i.test(userAgent)) {
    deviceCategory = 'MOBILE_IOS';
  } else if (/mobile/i.test(userAgent)) {
    deviceCategory = 'OTHER';
  }

  try {
    // 1. Query stand and assigned business
    const query = `
      SELECT 
        s.id AS stand_id,
        s.slug,
        s.stand_number,
        s.custom_label,
        s.is_active AS stand_active,
        s.is_archived,
        s.destination_type,
        s.destination_url_override,
        b.id AS business_id,
        b.name AS business_name,
        b.is_active AS business_active,
        b.google_review_url,
        b.digital_menu_url
      FROM stands s
      LEFT JOIN businesses b ON s.business_id = b.id
      WHERE s.slug = ?
      LIMIT 1
    `;

    const stand = await env.DB.prepare(query).bind(slug).first<any>();

    // If stand doesn't exist or is archived
    if (!stand || stand.is_archived) {
      return Response.redirect(`${url.origin}/#/status?code=not_found&slug=${encodeURIComponent(slug)}`, 302);
    }

    // Check if disabled/inactive
    if (!stand.stand_active || (stand.business_id && !stand.business_active)) {
      return Response.redirect(`${url.origin}/#/status?code=inactive&slug=${encodeURIComponent(slug)}`, 302);
    }

    // Determine final destination
    let destinationUrl = stand.destination_url_override;
    if (!destinationUrl) {
      if (stand.destination_type === 'REVIEW') {
        destinationUrl = stand.google_review_url;
      } else if (stand.destination_type === 'MENU_EXTERNAL') {
        destinationUrl = stand.digital_menu_url;
      }
    }

    // Record privacy-conscious analytics event
    const eventId = crypto.randomUUID();
    await env.DB.batch([
      env.DB.prepare(`
        INSERT INTO analytics_events (id, stand_id, slug, business_id, destination_type, destination_url, source, device_category, referrer)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).bind(
        eventId,
        stand.stand_id,
        stand.slug,
        stand.business_id || null,
        stand.destination_type,
        destinationUrl || 'LANDING_PAGE',
        isNfc ? 'NFC' : 'QR',
        deviceCategory,
        request.headers.get('referer') || null
      ),
      env.DB.prepare(`
        UPDATE stands SET visit_count = visit_count + 1, updated_at = datetime('now') WHERE id = ?
      `).bind(stand.stand_id)
    ]);

    // Handle destination modes:
    // If destination is REVIEW or MENU_HOSTED, route to client landing application for rich experience
    if (stand.destination_type === 'REVIEW' || stand.destination_type === 'MENU_HOSTED') {
      const targetPath = `/#/r/${encodeURIComponent(slug)}${isNfc ? '?nfc=1' : ''}`;
      return Response.redirect(`${url.origin}${targetPath}`, 302);
    }

    // Direct redirect for External Menu or Custom URL
    if (destinationUrl && (destinationUrl.startsWith('https://') || destinationUrl.startsWith('http://'))) {
      return Response.redirect(destinationUrl, 302);
    }

    // If unassigned or missing destination
    return Response.redirect(`${url.origin}/#/status?code=unassigned&slug=${encodeURIComponent(slug)}`, 302);

  } catch (error) {
    console.error('Redirect handler error:', error);
    return new Response('TapReview Service Temporarily Unavailable', { status: 500 });
  }
};
