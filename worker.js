// Cloudflare Worker entry point for Workers with Static Assets
export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    // If accessing /r/:slug, redirect to client SPA hash route using dynamic domain origin
    if (url.pathname.startsWith('/r/')) {
      const slug = url.pathname.replace('/r/', '').split('/')[0];
      const isNfc = url.searchParams.get('nfc') === '1';
      const customDomain = (env.APP_DOMAIN && typeof env.APP_DOMAIN === 'string' && env.APP_DOMAIN.trim() && !env.APP_DOMAIN.includes('tapreview.in'))
        ? env.APP_DOMAIN.trim()
        : null;
      const baseOrigin = customDomain 
        ? (customDomain.startsWith('http') ? customDomain.replace(/\/+$/, '') : `https://${customDomain.replace(/\/+$/, '')}`)
        : url.origin;
      return Response.redirect(`${baseOrigin}/#/r/${encodeURIComponent(slug)}${isNfc ? '?nfc=1' : ''}`, 302);
    }

    // Serve static assets from dist
    if (env.ASSETS) {
      return env.ASSETS.fetch(request);
    }

    return new Response('TapReview Service Active', { status: 200 });
  }
};
