// Vercel Edge Middleware — framework-agnostic, runs before Astro on every
// request. Only active on non-production HOSTNAMES (dev./dev-www./preview
// deploy URLs), so the live www/apex site is never gated. Matches the
// existing app-dev password (VITE_DEV_PASSWORD=harambe) for consistency
// across dev.*/dev-app.*/api.dev.*
//
// IMPORTANT: do NOT gate on process.env.VERCEL_ENV here. When a domain is
// assigned to track a specific non-main git branch (Vercel's per-domain
// "Git Branch" feature — used for dev.primateintelligence.ai -> dev branch),
// Vercel treats that as the PRODUCTION deployment *for that domain*, so
// VERCEL_ENV reads 'production' even though the content is the dev branch.
// That silently bypassed this gate (caught 2026-08-10) because the check
// above returned early. Hostname is the only reliable signal for "is this
// the real public prod site".
export const config = {
  matcher: '/(.*)',
};

const REALM = 'Primate Intelligence — Dev Preview';

// The ONLY hostnames that should ever be ungated. Everything else
// (dev., dev-www., *.vercel.app previews, git-branch preview URLs) gets
// the password prompt.
const PRODUCTION_HOSTS = new Set([
  'primateintelligence.ai',
  'www.primateintelligence.ai',
]);

export default function middleware(request: Request) {
  const host = (request.headers.get('host') || '').toLowerCase().split(':')[0];

  if (PRODUCTION_HOSTS.has(host)) {
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
