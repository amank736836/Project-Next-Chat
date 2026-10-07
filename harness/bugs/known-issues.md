# Known Issues — Stealthy Note

## Design Limitations

### KI-001: JWT Secret Fallback
- **File**: `lib/server/auth.js`
- **Issue**: JWT_SECRET defaults to 'fallback_secret' if not set
- **Impact**: Insecure default in production if env var missing
- **Recommendation**: Throw error if JWT_SECRET not configured

### KI-002: Admin Secret Key Default
- **File**: `lib/server/auth.js`
- **Issue**: ADMIN_SECRET_KEY defaults to 'Admin@1234'
- **Impact**: Predictable admin key if env var not set
- **Recommendation**: Throw error if ADMIN_SECRET_KEY not configured

### KI-003: CORS Wildcard on Public Endpoints
- **File**: `lib/server/cors.js`
- **Issue**: Public endpoints use Access-Control-Allow-Origin: *
- **Impact**: Any origin can call public APIs
- **Note**: This is intentional for widget/board functionality

### KI-004: Database Build Requirement
- **File**: `lib/server/db.js`
- **Issue**: MONGODB_URI validated at import time, even during build
- **Impact**: Build fails without MONGODB_URI (even if not needed for static pages)
- **Workaround**: Set a build-only placeholder

### KI-005: Proxy Route Catches All Unmatched API Routes
- **File**: `app/api/v1/[...slug]/route.js`
- **Issue**: Any unmatched /api/v1/* route is proxied to the external backend
- **Impact**: Typos in API paths silently proxy instead of 404
- **Note**: Intentional design for socket-backend features