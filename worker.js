// Cloudflare Worker entry point for Workers with Static Assets
export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    // If accessing /r/:slug, redirect to client SPA hash route
    if (url.pathname.startsWith('/r/')) {
      const slug = url.pathname.replace('/r/', '').split('/')[0];
      const isNfc = url.searchParams.get('nfc') === '1';
      return Response.redirect(`${url.origin}/#/r/${encodeURIComponent(slug)}${isNfc ? '?nfc=1' : ''}`, 302);
    }

    // Serve static assets from dist
    if (env.ASSETS) {
      return env.ASSETS.fetch(request);
    }

    return new Response('TapReview Service Active', { status: 200 });
  }
};
