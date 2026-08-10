// Vercel Edge Middleware — framework-agnostic, runs before Astro on every
// request. Only active on non-production deployments (dev/preview), so the
// live www site is never gated. Matches the existing app-dev password
// (VITE_DEV_PASSWORD=harambe) for consistency across dev.*/dev-app.*/api.dev.*
export const config = {
  matcher: '/(.*)',
};

const REALM = 'Primate Intelligence — Dev Preview';

export default function middleware(request: Request) {
  // Only gate non-production Vercel environments (preview/development).
  // Production (www.primateintelligence.ai / primateintelligence.ai) is
  // never password-protected.
  if (process.env.VERCEL_ENV === 'production') {
    return undefined;
  }

  const password = process.env.DEV_PASSWORD_GATE;
  if (!password) {
    // Gate misconfigured (env var missing) — fail open rather than lock
    // out a legitimate deploy preview with no way to recover.
    return undefined;
  }

  const auth = request.headers.get('authorization');
  if (auth) {
    const [scheme, encoded] = auth.split(' ');
    if (scheme === 'Basic' && encoded) {
      try {
        const decoded = atob(encoded);
        const sepIndex = decoded.indexOf(':');
        const pass = sepIndex === -1 ? decoded : decoded.slice(sepIndex + 1);
        if (pass === password) {
          return undefined;
        }
      } catch {
        // fall through to 401
      }
    }
  }

  return new Response('Authentication required', {
    status: 401,
    headers: {
      'WWW-Authenticate': `Basic realm="${REALM}"`,
      'Content-Type': 'text/plain',
    },
  });
}
