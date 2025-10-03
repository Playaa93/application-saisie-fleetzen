#!/bin/bash

# Test script for login endpoint - 405 diagnosis
# Run this after deploying fixes to verify the endpoint works

echo "=================================================="
echo "Testing /api/auth/login endpoint"
echo "=================================================="
echo ""

PRODUCTION_URL="https://application-saisie-fleetzen.vercel.app"
LOCAL_URL="http://localhost:3000"

# Detect if running against local or production
if [ "$1" == "local" ]; then
    BASE_URL=$LOCAL_URL
    echo "🏠 Testing LOCAL endpoint: $BASE_URL"
else
    BASE_URL=$PRODUCTION_URL
    echo "☁️  Testing PRODUCTION endpoint: $BASE_URL"
fi

echo ""
echo "=================================================="
echo "Test 1: OPTIONS request (check allowed methods)"
echo "=================================================="
curl -X OPTIONS "$BASE_URL/api/auth/login" \
  -i \
  -s \
  --max-time 10

echo ""
echo ""
echo "=================================================="
echo "Test 2: POST with invalid credentials"
echo "=================================================="
curl -X POST "$BASE_URL/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"wrongpassword"}' \
  -i \
  -s \
  --max-time 10

echo ""
echo ""
echo "=================================================="
echo "Test 3: POST with missing fields"
echo "=================================================="
curl -X POST "$BASE_URL/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com"}' \
  -i \
  -s \
  --max-time 10

echo ""
echo ""
echo "=================================================="
echo "Test 4: POST with malformed JSON"
echo "=================================================="
curl -X POST "$BASE_URL/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{invalid json}' \
  -i \
  -s \
  --max-time 10

echo ""
echo ""
echo "=================================================="
echo "Test 5: GET request (should fail)"
echo "=================================================="
curl -X GET "$BASE_URL/api/auth/login" \
  -i \
  -s \
  --max-time 10

echo ""
echo ""
echo "=================================================="
echo "Analysis"
echo "=================================================="
echo ""
echo "Expected results:"
echo "  Test 1 (OPTIONS): Should return 200 with Allow header"
echo "  Test 2 (Invalid creds): Should return 401 (not 405!)"
echo "  Test 3 (Missing fields): Should return 400 (not 405!)"
echo "  Test 4 (Malformed JSON): Should return 400 or 500 (not 405!)"
echo "  Test 5 (GET): Should return 405 (GET not allowed)"
echo ""
echo "If ALL tests return 405, the route handler is not being found."
echo "If Tests 2-4 return proper status codes, the fix worked!"
echo ""
