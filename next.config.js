/** @type {import('next').NextConfig} */

// If you're deploying under a sub-path (e.g. https://historytimelines.co/version-test)
// set NEXT_PUBLIC_BASE_PATH=/version-test in that environment.
// In production at the domain root, leave it unset.
const basePath = process.env.NEXT_PUBLIC_BASE_PATH || '';

const nextConfig = {
  reactStrictMode: true,

  // Enable static export where possible, but support ISR
  output: 'standalone',

  // Let Next know if we're running under a sub-path
  basePath,

  // Ensure static assets (CSS/JS) are requested from the same sub-path
  assetPrefix: basePath ? `${basePath}/` : undefined,

  // Image optimization
  images: {
    domains: [
      'supabase.co',
      'res.cloudinary.com',
    ],
    formats: ['image/avif', 'image/webp'],
  },

  // Experimental features
  experimental: {
    // Enable server actions if needed
    serverActions: true,
  },

  // Headers for SEO and performance
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on',
          },
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN',
          },
        ],
      },
    ];
  },

  // Rewrites for clean URLs if needed
  async rewrites() {
    return [];
  },
};

module.exports = nextConfig;
