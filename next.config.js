/** @type {import('next').NextConfig} */

// Dev-only: hosts that are allowed to request /_next/* resources (HMR, RSC
// payloads). Useful when the dev server is reached through a tunnel/preview
// proxy. Opt-in, e.g.  ALLOWED_DEV_ORIGINS="*.e2b.app" npm run dev
const allowedDevOrigins = (process.env.ALLOWED_DEV_ORIGINS || "")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

const nextConfig = {
  ...(allowedDevOrigins.length ? { allowedDevOrigins } : {}),
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**",
      },
    ],
  },
};

module.exports = nextConfig;
