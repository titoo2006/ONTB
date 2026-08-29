/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  typescript: {
    // CLAUDE.md Rule 5 — a build must never ship with type errors.
    ignoreBuildErrors: false,
  },
  eslint: {
    ignoreDuringBuilds: false,
  },
  // SECURITY.md §11 (P2) — CSP / HSTS / nosniff headers get added here once the
  // app is otherwise stable and on a fixed production domain.
};

export default nextConfig;
