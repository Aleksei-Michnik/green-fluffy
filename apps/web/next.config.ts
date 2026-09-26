import type { NextConfig } from 'next';
import createNextIntlPlugin from 'next-intl/plugin';
import { locales } from './src/i18n/routing';

const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts');

const nextConfig: NextConfig = {
  reactStrictMode: true,

  // Transpile workspace packages
  transpilePackages: ['@green-fluffy/shared'],

  // Standalone output for Docker deployments
  output: 'standalone',

  // The page is served at the production hostname through the shared local proxy (infra repo,
  // mdocker/), and Next 16 answers 403 to /_next dev requests (assets, the HMR socket) from an
  // origin it does not know. The hostname comes from the file the proxy toolkit generates from
  // its registry (see docker-compose.yml); it is never written in this repository.
  allowedDevOrigins: process.env.MDOCKER_DEV_ORIGINS
    ? process.env.MDOCKER_DEV_ORIGINS.split(',')
    : [],

  // Allow Server Actions from reverse proxy origins (CloudFlare)
  experimental: {
    serverActions: {
      allowedOrigins: process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(',') : [],
    },
  },

  // 301 redirects for old /{locale}/... URLs → /...
  async redirects() {
    return locales.flatMap((locale) => [
      {
        source: `/${locale}/:path+`,
        destination: '/:path+',
        permanent: true,
      },
      {
        source: `/${locale}`,
        destination: '/',
        permanent: true,
      },
    ]);
  },

  // Proxy API requests in development
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: `${process.env.API_INTERNAL_URL || 'http://localhost:3001/api/v1'}/:path*`,
      },
    ];
  },
};

export default withNextIntl(nextConfig);
