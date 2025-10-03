# 405 Method Not Allowed - Diagnostic Report

## Problem Summary
POST requests to `/api/auth/login` return 405 Method Not Allowed on Vercel production, despite the route file existing with a proper POST export.

## Root Cause Analysis

### Issue #1: Vercel Configuration Path Mismatch ⚠️ CRITICAL

**Problem**: The `vercel.json` file uses incorrect path patterns:

```json
"functions": {
  "app/api/**/*.ts": { ... }  // ❌ WRONG - references 'app' directory
}
```

**Reality**: The actual Next.js App Router structure is:
- Source: `src/app/api/auth/login/route.ts`
- Build output: `.next/server/app/api/auth/login.js`

**Impact**: Vercel's function configuration doesn't apply to the login route, potentially causing:
1. Wrong runtime environment
2. Missing environment variables
3. Incorrect execution context
4. Method handling issues

### Issue #2: Module-Level Variables in Middleware

The middleware file has module-level Supabase initialization:

```typescript
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
```

While the matcher excludes `/api/*`, this could still cause build-time issues if environment variables aren't available.

### Issue #3: No Runtime Configuration

The route file lacks explicit runtime configuration. Next.js 14+ may need explicit Edge/Node.js runtime declaration.

## Verification Steps

### 1. Test OPTIONS Request
```bash
curl -X OPTIONS https://application-saisie-fleetzen.vercel.app/api/auth/login \
  -i
```

**Expected**: Should return `Allow: POST, OPTIONS` header
**If 405**: Route isn't being recognized at all

### 2. Test with Verbose Headers
```bash
curl -X POST https://application-saisie-fleetzen.vercel.app/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"test"}' \
  -i
```

Look for:
- `x-vercel-cache`: Shows if response is cached
- `x-vercel-id`: Request ID for logs
- `x-matched-path`: Should be `/api/auth/login`

### 3. Check Vercel Build Logs

Look for:
```
Route (app)                               Size
...
○ /api/auth/login                         - (Route)
```

**If missing**: The route isn't being built
**If present**: The route exists but isn't executing

### 4. Test Local Build
```bash
npm run build
npm start

curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"test"}'
```

**If works locally but not on Vercel**: Environment/configuration issue
**If fails locally**: Code issue

## Fix Strategy

### Fix #1: Correct Vercel Configuration (HIGHEST PRIORITY)

Update `vercel.json`:

```json
{
  "functions": {
    "src/app/api/**/*.ts": {
      "maxDuration": 10,
      "memory": 1024
    },
    "src/app/api/sync/**/*.ts": {
      "maxDuration": 30,
      "memory": 1024
    }
  }
}
```

Or remove the functions config entirely and let Vercel auto-detect.

### Fix #2: Add Runtime Configuration

Add to `src/app/api/auth/login/route.ts`:

```typescript
export const runtime = 'nodejs'; // or 'edge'
export const dynamic = 'force-dynamic';
export const revalidate = 0;
```

### Fix #3: Move Middleware Variables to Function Scope

Update `src/middleware.ts`:

```typescript
export async function middleware(request: NextRequest) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  // ... rest of the code
}
```

### Fix #4: Add Explicit Route Handler

Create `src/app/api/auth/login/.gitkeep` to ensure directory exists in git, or verify the route is being included in builds.

### Fix #5: Clear Vercel Cache

After deploying fixes:
```bash
vercel --force  # Force new deployment
```

Or in Vercel dashboard: Settings → Clear Build Cache & Redeploy

## Next Steps

1. **Immediate**: Fix vercel.json path patterns
2. **High Priority**: Add runtime configuration to route
3. **Medium Priority**: Move middleware variables to function scope
4. **Testing**: Run all verification steps after each fix
5. **Monitoring**: Check Vercel logs for any build warnings

## Expected Behavior After Fix

```bash
$ curl -X POST https://application-saisie-fleetzen.vercel.app/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"valid@example.com","password":"validpass"}'

{"success":true,"user":{...},"session":{...}}  # 200 OK
```

## Additional Notes

- Next.js 14.2.15 is being used (not 15), so async params are not an issue
- The login route file structure is correct
- No conflicting API route files found
- Middleware is properly excluding `/api/*` routes
