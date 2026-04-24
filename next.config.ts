import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./i18n/request.ts");

const isDev = process.env.NODE_ENV === "development";

// Per-article JSON-LD is inlined via dangerouslySetInnerHTML, which makes a
// nonce-based CSP impractical — nonces require dynamic rendering, which would
// disable ISR. We accept 'unsafe-inline' for scripts/styles and rely on the
// author-controlled markdown pipeline + other directives for XSS defence.
//
// TODO(csp-hardening): revisit once Next.js supports per-route CSP nonces
// without forcing dynamic rendering, or if we migrate JSON-LD to static
// import with content hashes (sha256).
const csp = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""} https://umami.deploybox.space`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' blob: data: https://i.ibb.co https://supabase.deploybox.space",
  "font-src 'self' data:",
  "connect-src 'self' https://umami.deploybox.space https://supabase.deploybox.space",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  "upgrade-insecure-requests",
].join("; ");

const securityHeaders = [
  { key: "Content-Security-Policy", value: csp },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), interest-cohort=()",
  },
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
];

const nextConfig: NextConfig = {
  images: {
    formats: ["image/avif", "image/webp"],
    remotePatterns: [
      { protocol: "https", hostname: "i.ibb.co" },
      {
        protocol: "https",
        hostname: "supabase.deploybox.space",
        pathname: "/storage/v1/object/public/**",
      },
    ],
  },
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

export default withNextIntl(nextConfig);
