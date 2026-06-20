#!/usr/bin/env bash
# Live HTTP smoke test for AI priority endpoints (requires running server + DB).
set -euo pipefail

BASE="${API_BASE:-http://localhost:4001/api}"
PASS=0
FAIL=0

check() {
  local name="$1"
  local method="$2"
  local path="$3"
  local body="${4:-}"
  local expect="${5:-200}"

  if [ "$method" = "GET" ]; then
    status=$(curl -s -o /tmp/ai_verify_body.json -w "%{http_code}" "${BASE}${path}")
  else
    status=$(curl -s -o /tmp/ai_verify_body.json -w "%{http_code}" \
      -X "$method" \
      -H "Content-Type: application/json" \
      -d "$body" \
      "${BASE}${path}")
  fi

  if [ "$status" = "$expect" ]; then
    echo "OK  $name ($status)"
    PASS=$((PASS + 1))
  else
    echo "FAIL $name (expected $expect, got $status)"
    head -c 200 /tmp/ai_verify_body.json 2>/dev/null || true
    echo ""
    FAIL=$((FAIL + 1))
  fi
}

echo "AI priorities HTTP smoke — $BASE"
echo "---"

check "P6 smart search" POST "/ai/search" \
  '{"query":"I need a wireless mouse under $50 for FPS games","limit":12}'

check "P5 SEO generator" POST "/ai/admin/seo-generator" \
  '{"productName":"Gaming Mouse","category":"Electronics"}' \
  "401"

SESSION_ID="a1b2c3d4-e5f6-7890-abcd-ef1234567890"

check "P3 assistant chat" POST "/ai/chat" \
  "{\"message\":\"Where is my order?\",\"sessionId\":\"$SESSION_ID\",\"history\":[]}"

check "P2 product rec via chat" POST "/ai/chat" \
  "{\"message\":\"Best laptop under 800\",\"sessionId\":\"$SESSION_ID\",\"history\":[]}"

check "P1 sales context" GET "/ai/sales/context?sessionId=$SESSION_ID"

echo "---"
echo "Passed: $PASS  Failed: $FAIL"
if [ "$FAIL" -gt 0 ]; then
  exit 1
fi
