/** @type {import('next').NextConfig} */

// Dev-only: hosts that are allowed to request /_next/* resources (HMR, RSC
// payloads). Useful when the dev server is reached through a tunnel/preview
// proxy. Opt-in, e.g.  ALLOWED_DEV_ORIGINS="*.e2b.app" npm run dev
const allowedDevOrigins = (process.env.ALLOWED_DEV_ORIGINS || "")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

// SECURITY: next/image fetches remote images server-side, so the allowed
// hosts are an allowlist instead of "**" (which turns the image optimizer
// into an open proxy/SSRF surface). Extend with NEXT_IMAGE_HOSTS if needed,
// e.g. NEXT_IMAGE_HOSTS="**.cloudinary.com,images.example.com"
const imageHostAllowlist = process.env.NEXT_IMAGE_HOSTS
  ? process.env.NEXT_IMAGE_HOSTS.split(",").map((host) => host.trim()).filter(Boolean)
  : ["**.cloudinary.com", "**.googleusercontent.com", "**.gravatar.com"];

// SECURITY: baseline response headers for every route.
const baseSecurityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), payment=()",
  },
];

const nextConfig = {
  ...(allowedDevOrigins.length ? { allowedDevOrigins } : {}),
  images: {
    remotePatterns: imageHostAllowlist.map((hostname) => ({
      protocol: "https",
      hostname,
    })),
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: baseSecurityHeaders,
      },
      {
        // SECURITY: clickjacking protection everywhere except /embed/*,
        // which is intentionally designed to be iframed on third-party sites.
        source: "/((?!embed).*)",
        headers: [{ key: "X-Frame-Options", value: "SAMEORIGIN" }],
      },
    ];
  },
};

module.exports = nextConfig;
