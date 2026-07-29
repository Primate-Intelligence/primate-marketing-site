#!/bin/bash
set -u
CURL=/usr/bin/curl
B="${1:-https://primate-marketing-site.vercel.app}"
pass=0; fail=0

tr301() { # path expected-location
  out=$($CURL -s -o /dev/null -w "%{http_code}|%{redirect_url}" "$B$1")
  code=${out%%|*}; loc=${out#*|}
  if { [ "$code" = "301" ] || [ "$code" = "308" ]; } && [ "$loc" = "$2" ]; then
    echo "PASS 301 $1 -> $loc"; pass=$((pass+1))
  else
    echo "FAIL $1 -> code=$code loc=$loc (want 301 $2)"; fail=$((fail+1))
  fi
}
t200() { # path
  code=$($CURL -s -o /dev/null -w "%{http_code}" "$B$1")
  if [ "$code" = "200" ]; then echo "PASS 200 $1"; pass=$((pass+1)); else echo "FAIL $1 -> $code (want 200)"; fail=$((fail+1)); fi
}

echo "=== Product/auth 301s -> app.* ==="
tr301 /login https://app.primateintelligence.ai/login
tr301 /signup https://app.primateintelligence.ai/signup
tr301 /sign-in https://app.primateintelligence.ai/login
tr301 /sign-up https://app.primateintelligence.ai/signup
tr301 /onboarding https://app.primateintelligence.ai/onboarding
tr301 /dashboard https://app.primateintelligence.ai/dashboard
tr301 /dashboard/usage https://app.primateintelligence.ai/dashboard/usage
tr301 /dashboard/api-keys https://app.primateintelligence.ai/dashboard/api-keys
tr301 /dashboard/billing https://app.primateintelligence.ai/dashboard/billing
tr301 /dashboard/settings https://app.primateintelligence.ai/dashboard/settings
tr301 /dashboard/admin https://app.primateintelligence.ai/dashboard/admin
tr301 /dashboard/admin/emails https://app.primateintelligence.ai/dashboard/admin/emails
tr301 /dashboard/leads https://app.primateintelligence.ai/dashboard/leads
tr301 /dashboard/leads/42 https://app.primateintelligence.ai/dashboard/leads/42
tr301 /dashboard/investors https://app.primateintelligence.ai/dashboard/investors
tr301 /dashboard/investors/7 https://app.primateintelligence.ai/dashboard/investors/7
tr301 /dashboard/investor-crm https://app.primateintelligence.ai/dashboard/investor-crm
tr301 /dashboard/growth https://app.primateintelligence.ai/dashboard/growth
tr301 /dashboard/blog https://app.primateintelligence.ai/dashboard/blog
tr301 /dashboard/careers https://app.primateintelligence.ai/dashboard/careers
tr301 /dashboard/admin/winloss https://app.primateintelligence.ai/dashboard/admin/winloss
tr301 /dashboard/admin/api-settings https://app.primateintelligence.ai/dashboard/admin/api-settings
tr301 /dashboard/admin/demo-library https://app.primateintelligence.ai/dashboard/admin/demo-library
tr301 /dashboard/admin/devops https://app.primateintelligence.ai/dashboard/admin/devops
tr301 /dashboard/admin/prompts https://app.primateintelligence.ai/dashboard/admin/prompts
tr301 /dashboard/admin/pricing https://app.primateintelligence.ai/dashboard/admin/pricing
tr301 /admin/blog https://app.primateintelligence.ai/admin/blog
tr301 /admin/waitlist https://app.primateintelligence.ai/admin/waitlist
tr301 /claim https://app.primateintelligence.ai/claim
tr301 /claim/ABC123 https://app.primateintelligence.ai/claim/ABC123
tr301 /invite https://app.primateintelligence.ai/invite
tr301 /waitlist https://app.primateintelligence.ai/signup
tr301 /primate-vision https://app.primateintelligence.ai/
tr301 /demo https://app.primateintelligence.ai/
tr301 /500 https://app.primateintelligence.ai/500

echo "=== Query-string preservation ==="
out=$($CURL -s -o /dev/null -w "%{http_code}|%{redirect_url}" "$B/login?redirect_to=%2Fdashboard&x=1")
echo "$out" | grep -q "app.primateintelligence.ai/login?redirect_to=%2Fdashboard&x=1" && { echo "PASS query preserved: $out"; pass=$((pass+1)); } || { echo "FAIL query: $out"; fail=$((fail+1)); }

echo "=== /v2 legacy -> app.* ==="
tr301 /v2 https://app.primateintelligence.ai/
tr301 /v2/login https://app.primateintelligence.ai/login
tr301 /v2/signup https://app.primateintelligence.ai/signup
tr301 /v2/onboarding https://app.primateintelligence.ai/onboarding
tr301 /v2/waitlist https://app.primateintelligence.ai/signup
tr301 /v2/invite https://app.primateintelligence.ai/invite
tr301 /v2/dashboard https://app.primateintelligence.ai/dashboard
tr301 /v2/dashboard/usage https://app.primateintelligence.ai/dashboard/usage
tr301 /v2/dashboard/admin/settings https://app.primateintelligence.ai/dashboard/admin/pricing
tr301 /v2/dashboard/admin/devops https://app.primateintelligence.ai/dashboard/admin/devops

echo "=== /v2 legacy -> marketing (relative) ==="
tr301 /v2/docs "$B/docs"
tr301 /v2/pricing "$B/pricing"
tr301 /v2/use-cases "$B/use-cases"
tr301 /v2/blog "$B/blog"
tr301 /v2/blog/how-jepa-works "$B/blog/how-jepa-works"
tr301 /v2/values "$B/values"
tr301 /v2/team "$B/team"
tr301 /v2/careers "$B/careers"
tr301 /v2/terms "$B/terms"
tr301 /v2/privacy "$B/privacy"
tr301 /v2/cookie-policy "$B/cookie-policy"

echo "=== Marketing pages stay 200 on apex ==="
t200 /
t200 /pricing
t200 /use-cases
t200 /blog
t200 /values
t200 /team
t200 /careers
t200 /privacy
t200 /terms
t200 /cookie-policy
t200 /docs
t200 /docs/quickstart
t200 /docs/reference
t200 /llms.txt
t200 /llms-full.txt
t200 /robots.txt
t200 /rss.xml
t200 /sitemap.xml
t200 /sitemap-index.xml
t200 /.well-known/llms.txt
t200 /agents.md

echo "=== Blog slugs 1:1 (all 12) ==="
# published slugs (SPA getAllPosts filters status==published; only these 2 ever rendered publicly)
for slug in benchmarks-deep-dive how-jepa-works; do t200 "/blog/$slug"; done
# draft slugs must 404 (parity: drafts were never publicly rendered by the SPA)
for slug in primate-vision-vs-yolo-benchmark deterministic-cv-matters false-tradeoff-computer-vision why-we-stopped-vlms jepa-architecture-explainer introducing-primate-vision world-models-market-context philosophy-of-jepa-intelligence scene-understanding-security-cameras what-are-jepa-world-models-good-for-today; do
  code=$($CURL -s -o /dev/null -w "%{http_code}" "$B/blog/$slug")
  if [ "$code" = "404" ]; then echo "PASS 404 (draft) /blog/$slug"; pass=$((pass+1)); else echo "FAIL /blog/$slug -> $code (want 404)"; fail=$((fail+1)); fi
done

echo "=== OAuth carve-out: proxy 200, NOT a redirect ==="
out=$($CURL -s -o /dev/null -w "%{http_code}|%{redirect_url}" "$B/oauth/consent?request_id=test123")
code=${out%%|*}; loc=${out#*|}
if [ "$code" = "200" ] && [ -z "$loc" ]; then echo "PASS /oauth/consent proxied 200 (no redirect)"; pass=$((pass+1)); else echo "FAIL /oauth/consent -> $out"; fail=$((fail+1)); fi
# proxied consent page must reference SPA assets that also resolve via the proxy
asset=$($CURL -s "$B/oauth/consent" | grep -oE '/assets/index-[A-Za-z0-9_-]+\.js' | head -1)
if [ -n "$asset" ]; then
  acode=$($CURL -s -o /dev/null -w "%{http_code}" "$B$asset")
  if [ "$acode" = "200" ]; then echo "PASS proxied SPA asset $asset -> 200"; pass=$((pass+1)); else echo "FAIL asset $asset -> $acode"; fail=$((fail+1)); fi
else echo "FAIL no asset ref found in proxied consent page"; fail=$((fail+1)); fi

echo "=== IMMOVABLE byte-identity vs PRI-505 baselines ==="
check_sha() { # path expected-sha expected-bytes
  tmp=$(mktemp)
  code=$($CURL -s -o "$tmp" -w "%{http_code}" "$B$1")
  sha=$(/usr/bin/shasum -a 256 "$tmp" | cut -d' ' -f1)
  bytes=$(/usr/bin/stat -f %z "$tmp")
  rm -f "$tmp"
  if [ "$code" = "200" ] && [ "$sha" = "$2" ]; then echo "PASS byte-identical $1 (sha=$sha bytes=$bytes)"; pass=$((pass+1)); else echo "FAIL $1 code=$code sha=$sha bytes=$bytes (want $2 / $3)"; fail=$((fail+1)); fi
}
check_sha /demos/chatgpt-plugin-demo.mp4 2c90186fabd0055bd738b07f1ef52b0e41597146f6d74765096c0551692fb4b7 2658103
check_sha /demos/empty-state/forklift-demo.mp4 441d333721ce424bdb1c088c8cf1f3ce8fb84cf8895a5c9f3757e079c5a5d107 4233

echo ""
echo "TOTAL: pass=$pass fail=$fail"
[ "$fail" = "0" ]
