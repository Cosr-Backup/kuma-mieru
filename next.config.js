/** @type {import('next').NextConfig} */
const fs = require('node:fs');
const path = require('node:path');
const createNextIntlPlugin = require('next-intl/plugin');

const getImageDomains = () => {
  try {
    const configPath = path.join(process.cwd(), 'config', 'generated', 'image-domains.json');
    const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    return config.domains;
  } catch (e) {
    return ['*'];
  }
};

const isDevelopment = process.env.NODE_ENV === 'development';

const baseConfig = {
  poweredByHeader: false,
  compress: true,

  reactStrictMode: true,

  images: {
    remotePatterns: getImageDomains().map(hostname => ({
      protocol: 'https',
      hostname,
    })),
    formats: ['image/avif', 'image/webp'],
    dangerouslyAllowSVG: true,
  },

  webpack: (config, { isServer, dev }) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      '@': path.join(__dirname),
    };

    if (!isServer && !dev) {
      config.optimization.splitChunks = {
        chunks: 'all',
        maxSize: 244000, // 244KB chunks
      };

      config.externals = {
        ...config.externals,
        'utf-8-validate': 'commonjs utf-8-validate',
        bufferutil: 'commonjs bufferutil',
      };
    }

    if (dev) {
      config.cache = {
        type: 'filesystem',
        buildDependencies: {
          config: [__filename],
        },
      };
    }

    return config;
  },
};

const productionConfig = {
  ...baseConfig,
  output: 'standalone',

  compiler: {
    removeConsole: {
      exclude: ['error', 'warn'],
    },
    reactRemoveProperties: true,
  },

  serverExternalPackages: ['sharp', 'cheerio', 'markdown-it', 'sanitize-html'],

  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN',
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
        ],
      },
      {
        source: '/api/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=60, stale-while-revalidate=300',
          },
        ],
      },
    ];
  },
};

const developmentConfig = {
  ...baseConfig,

  compiler: {
    removeConsole: false,
  },
};

const withNextIntl = createNextIntlPlugin('./utils/i18n/request.ts');
const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
  openAnalyzer: true,
});

// Cloudflare Deployment
if (process.env.CF_DEPLOYMENT) {
  plugins.push([
    () => ({
      experimental: {
        runtime: 'edge',
      },
    }),
  ]);
}

const config = isDevelopment ? developmentConfig : productionConfig;

module.exports = withNextIntl(withBundleAnalyzer(config));
