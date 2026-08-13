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

// The ONLY hostnames that should ever be ungated. Everything else
// (dev., dev-www., *.vercel.app previews, git-branch preview URLs) gets
// the password prompt.
const PRODUCTION_HOSTS = new Set([
  'primateintelligence.ai',
  'www.primateintelligence.ai',
]);

const COOKIE_NAME = 'primate_dev_auth';

// Static assets the gate page itself needs to render (logo) — let these
// through unauthenticated so the gate page isn't a broken image + form.
const ASSET_ALLOWLIST = new Set([
  '/Darwin_v3_vinyl_transparent.png',
  '/favicon.ico',
]);

// llms.txt / llms-full.txt (+ .well-known alias) are machine-readable docs
// artifacts meant to be publicly fetchable without auth — that's the whole
// point of the llms.txt convention (agent discoverability, PRI-499). Gating
// them behind the dev password broke two CI jobs in primate-intelligence-api
// (doc-tests.mjs / run-samples.mjs fetch DOCS_SITE/llms-full.txt unauthenticated
// to build the doc-test corpus) — 401s there were failing the dev branch's
// required checks and blocking Railway auto-deploy (caught 2026-08-13).
// These paths carry no secrets, so exempting them from the gate on dev/preview
// hosts is safe and matches how they already behave in production.
const DOCS_ARTIFACT_ALLOWLIST = new Set([
  '/llms.txt',
  '/llms-full.txt',
  '/.well-known/llms.txt',
]);

async function sha256Hex(input: string): Promise<string> {
  const data = new TextEncoder().encode(input);
  const digest = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

// ── Light-mode palette — matches the app's PasswordGate.tsx exactly ──
const L = {
  bgPage: '#F2F0EB',
  bgSurface: '#FAFAF7',
  border: '#D4D0C8',
  textPrimary: '#1A1916',
  textMuted: '#7A7669',
  signal: '#1B4FE0',
  signalHover: '#1340C8',
};

function gatePage(opts: { error?: boolean; redirectTo: string }): string {
  const { error, redirectTo } = opts;
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<meta name="robots" content="noindex, nofollow">
<link rel="icon" type="image/png" href="/Darwin_v3_vinyl_transparent.png">
<title>Primate Intelligence — Dev Preview</title>
<style>
  * { box-sizing: border-box; }
  body {
    margin: 0;
    min-height: 100vh;
    background: ${L.bgPage};
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 56px 20px 80px;
    font-family: Inter, -apple-system, BlinkMacSystemFont, "Helvetica Neue", sans-serif;
  }
  .logo-row { display: flex; align-items: center; gap: 16px; margin-bottom: 44px; }
  .logo-img { height: 80px; width: auto; object-fit: contain; flex-shrink: 0; }
  .logo-text { display: flex; flex-direction: column; line-height: 1.1; }
  .logo-text span { font-size: 36px; font-weight: 700; letter-spacing: -0.035em; }
  .logo-text .primate { color: ${L.textPrimary}; }
  .logo-text .intelligence { color: ${L.signal}; }
  .card-wrap { width: 100%; max-width: 400px; }
  .divider { display: flex; align-items: center; gap: 12px; margin-bottom: 20px; }
  .divider .line { flex: 1; height: 1px; background: ${L.border}; }
  .divider .label {
    font-size: 10px; font-family: "JetBrains Mono", monospace; letter-spacing: 0.14em;
    text-transform: uppercase; color: ${L.textMuted}; white-space: nowrap;
  }
  .card {
    background: ${L.bgSurface};
    border: 1px solid ${L.border};
    border-radius: 16px;
    padding: 28px 28px 24px;
    box-shadow: 0 1px 2px rgba(0,0,0,0.04), 0 4px 12px rgba(0,0,0,0.06), 0 12px 32px rgba(0,0,0,0.04);
  }
  .card p { font-size: 14px; color: ${L.textMuted}; margin: 0 0 18px; text-align: center; line-height: 1.5; }
  form { display: flex; flex-direction: column; gap: 10px; }
  input[type=password] {
    width: 100%; border-radius: 10px; border: 1.5px solid ${error ? '#EF4444' : L.border};
    background: #FFFFFF; padding: 12px 16px; font-size: 15px; color: ${L.textPrimary};
    text-align: center; letter-spacing: 0.18em; outline: none; font-family: inherit;
  }
  input[type=password]:focus { border-color: ${L.signal}; }
  button {
    width: 100%; border-radius: 10px; background: ${L.signal}; border: none;
    padding: 13px 24px; font-size: 15px; font-weight: 600; color: #FFFFFF;
    cursor: pointer; letter-spacing: -0.01em; font-family: inherit;
  }
  button:hover { background: ${L.signalHover}; }
  @keyframes shake {
    0%,100% { transform: translateX(0); }
    18% { transform: translateX(-9px); }
    36% { transform: translateX(9px); }
    54% { transform: translateX(-6px); }
    72% { transform: translateX(6px); }
  }
  .shake { animation: shake 0.55s cubic-bezier(0.36,0.07,0.19,0.97) both; }
  @media (max-width: 640px) {
    body { padding: 28px 16px 40px; }
    .logo-img { height: 48px; }
    .logo-text span { font-size: 24px; }
  }
</style>
</head>
<body>
  <div class="logo-row">
    <img class="logo-img" src="/Darwin_v3_vinyl_transparent.png" alt="">
    <div class="logo-text">
      <span class="primate">Primate</span>
      <span class="intelligence">Intelligence</span>
    </div>
  </div>
  <div class="card-wrap">
    <div class="divider"><div class="line"></div><span class="label">Dev Preview</span><div class="line"></div></div>
    <div class="card">
      <p>${error ? 'Incorrect password — try again' : 'Enter password to continue'}</p>
      <form method="POST" action="/__dev_gate">
        <input type="hidden" name="redirect" value="${redirectTo.replace(/"/g, '&quot;')}">
        <input type="password" name="password" placeholder="Password" autofocus class="${error ? 'shake' : ''}">
        <button type="submit">Enter</button>
      </form>
    </div>
  </div>
</body>
</html>`;
}

export default async function middleware(request: Request) {
  const url = new URL(request.url);
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

  if (ASSET_ALLOWLIST.has(url.pathname) || DOCS_ARTIFACT_ALLOWLIST.has(url.pathname)) {
    return undefined;
  }

  const expectedHash = await sha256Hex(password);

  // Handle the gate form submission.
  if (url.pathname === '/__dev_gate' && request.method === 'POST') {
    const form = await request.formData();
    const submitted = String(form.get('password') || '');
    const redirectTo = String(form.get('redirect') || '/');
    if (submitted === password) {
      const res = new Response(null, {
        status: 303,
        headers: { Location: redirectTo || '/' },
      });
      res.headers.append(
        'Set-Cookie',
        `${COOKIE_NAME}=${expectedHash}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=2592000`
      );
      return res;
    }
    return new Response(gatePage({ error: true, redirectTo }), {
      status: 401,
      headers: { 'Content-Type': 'text/html; charset=utf-8' },
    });
  }

  // Cookie auth check for everything else.
  const cookieHeader = request.headers.get('cookie') || '';
  const cookies = new Map(
    cookieHeader.split(';').map((c) => {
      const idx = c.indexOf('=');
      return idx === -1 ? [c.trim(), ''] : [c.slice(0, idx).trim(), c.slice(idx + 1).trim()];
    })
  );
  if (cookies.get(COOKIE_NAME) === expectedHash) {
    return undefined;
  }

  return new Response(gatePage({ redirectTo: url.pathname + url.search }), {
    status: 401,
    headers: { 'Content-Type': 'text/html; charset=utf-8' },
  });
}
