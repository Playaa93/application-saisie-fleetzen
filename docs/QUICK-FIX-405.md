# 🚨 QUICK FIX: 405 Method Not Allowed

## TL;DR - What Was Fixed

**Problem**: `vercel.json` had wrong path pattern `app/api/**/*.ts` instead of `src/app/api/**/*.ts`

**Fix**: Three changes made:
1. ✅ Updated `vercel.json` path patterns
2. ✅ Added runtime config to login route
3. ✅ Fixed middleware variable scope

## Deploy Now (3 Commands)

```bash
# 1. Build and verify locally
npm run build && node scripts/verify-build.js

# 2. Test locally (optional but recommended)
npm start  # In one terminal
bash scripts/test-login-endpoint.sh local  # In another terminal

# 3. Deploy to Vercel
git add . && git commit -m "fix: Correct Vercel paths for 405 error" && git push
```

## Test Production (After Deploy)

```bash
# Wait 1 minute after deployment, then:
bash scripts/test-login-endpoint.sh

# Or quick manual test:
curl -X POST https://application-saisie-fleetzen.vercel.app/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test","password":"test"}' \
  -w "\nStatus: %{http_code}\n"
```

## Expected Results

| Test | Before (Bug) | After (Fixed) |
|------|--------------|---------------|
| POST with invalid creds | ❌ 405 | ✅ 401 |
| POST with missing fields | ❌ 405 | ✅ 400 |
| POST with valid creds | ❌ 405 | ✅ 200 |
| GET request | ⚠️ 405 | ⚠️ 405 (expected) |

## If Still Getting 405

```bash
# Clear Vercel cache and force redeploy
vercel --prod --force

# Wait 2 minutes, then test again
sleep 120 && bash scripts/test-login-endpoint.sh
```

## Check Vercel Dashboard

Go to: **Vercel Dashboard → Functions**

Look for:
- ✅ `/api/auth/login` should appear in function list
- ✅ Runtime: "Node.js 18.x" or higher
- ✅ Max Duration: 10 seconds

## Need More Details?

Read: `docs/405-fix-summary.md` (complete guide)
