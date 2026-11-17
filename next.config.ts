import type { NextConfig } from "next";

/**
 * A API (api-onco-dash) é chamada pelo mesmo endereço do front: /api/* é
 * repassado para API_URL. Assim o cookie de sessão (httpOnly) fica no próprio
 * domínio do painel, sem liberações de CORS entre domínios.
 *   desenvolvimento: API_URL=http://localhost:3001
 *   Railway:         API_URL=http://<serviço-da-api>.railway.internal:<porta>
 */
const apiUrl = (process.env.API_URL ?? "http://localhost:3001").replace(/\/$/, "");

const securityHeaders = [
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(self)" },
];

const nextConfig: NextConfig = {
  cacheComponents: true,
  partialPrefetching: true,
  poweredByHeader: false,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
  async rewrites() {
    return {
      // O painel é o do protótipo (HTML + D3 em public/painel), servido na raiz.
      beforeFiles: [{ source: "/", destination: "/painel/index.html" }],
      afterFiles: [{ source: "/api/:path*", destination: `${apiUrl}/:path*` }],
      fallback: [],
    };
  },
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

export default nextConfig;
