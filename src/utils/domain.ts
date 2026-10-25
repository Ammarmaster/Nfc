/**
 * Dynamically resolves the domain used for QR codes, NFC tags, and links:
 * 1. .env file: VITE_APP_DOMAIN (e.g. VITE_APP_DOMAIN=mybrand.com)
 * 2. User configured domain in Settings (if modified in the UI)
 * 3. Dynamic current browser host (window.location.host, e.g. nfc.pages.dev, localhost:5173)
 */
export function getAppDomain(userConfiguredDomain?: string): string {
  // 1. Priority: .env VITE_APP_DOMAIN
  const envDomain = import.meta.env.VITE_APP_DOMAIN;
  if (envDomain && typeof envDomain === 'string' && envDomain.trim()) {
    return cleanDomain(envDomain);
  }

  // 2. User configured in dashboard settings (if not default tapreview.in)
  if (userConfiguredDomain && userConfiguredDomain.trim() && userConfiguredDomain.trim().toLowerCase() !== 'tapreview.in') {
    return cleanDomain(userConfiguredDomain);
  }

  // 3. Fallback: Dynamic browser URL host (the actual domain currently being visited)
  if (typeof window !== 'undefined' && window.location?.host) {
    return window.location.host;
  }

  return 'tapreview.in';
}

function cleanDomain(d: string): string {
  return d.trim()
    .replace(/^https?:\/\//i, '')
    .replace(/\/+$/, '');
}
