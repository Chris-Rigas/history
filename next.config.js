/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  
  // Enable static export where possible, but support ISR
  output: 'standalone',
  
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
            value: 'on'
          },
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN'
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
