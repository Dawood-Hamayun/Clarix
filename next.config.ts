import type { NextConfig } from "next";

/**
 * The embeddable chat widget (public/widget.js + /embed) has to load
 * inside iframes on customer websites. That means:
 *
 *   1. /embed must be frameable from any origin (CSP frame-ancestors *).
 *      Next.js does not set X-Frame-Options by default, but being explicit
 *      about a permissive frame-ancestors keeps Vercel & proxies from
 *      refusing the frame.
 *
 *   2. /widget.js is a script hosted in /public. Browsers serve static files
 *      with sensible defaults; we just add a permissive cache + CORS header
 *      so any domain can <script src=".../widget.js"> it.
 */
const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        source: "/embed",
        headers: [
          {
            key: "Content-Security-Policy",
            value: "frame-ancestors *",
          },
        ],
      },
      {
        source: "/widget.js",
        headers: [
          { key: "Access-Control-Allow-Origin", value: "*" },
          { key: "Cache-Control", value: "public, max-age=300" },
        ],
      },
    ];
  },
};

export default nextConfig;
