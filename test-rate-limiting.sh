#!/bin/bash

echo "Testing rate limiting on production..."
echo "Attempting 6 logins with wrong password..."
echo ""

for i in {1..6}; do
  echo "=== Attempt $i ==="
  response=$(curl -s -w "\nHTTP_STATUS:%{http_code}" \
    -X POST https://care-collective-preview.vercel.app/api/auth/login \
    -H "Content-Type: application/json" \
    -d '{"email":"test@example.com","password":"wrongpassword"}')

  http_status=$(echo "$response" | grep "HTTP_STATUS:" | cut -d: -f2)
  body=$(echo "$response" | grep -v "HTTP_STATUS:")

  echo "Status: $http_status"
  echo "Response: $body" | head -c 200
  echo ""
  echo ""

  sleep 0.5
done

echo "✅ Test complete!"
echo ""
echo "Expected results:"
echo "  - Attempts 1-5: Status 401 (Unauthorized - wrong password)"
echo "  - Attempt 6: Status 429 (Too Many Requests - rate limited)"
