import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 's3plus-bj02.sankuai.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: '*.sankuai.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'longcat.chat',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'xqtzsandvudxmjbrrnja.supabase.co',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: '*.supabase.co',
        port: '',
        pathname: '/**',
      },
      // Free AI image services
      {
        protocol: 'https',
        hostname: 'picsum.photos',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'via.placeholder.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'image.pollinations.ai',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: '*.pollinations.ai',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'api.deepai.org',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: '*.deepai.org',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'api.limewire.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: '*.replicate.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'replicate.delivery',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'pbxt.replicate.delivery',
        port: '',
        pathname: '/**',
      },
    ],
  },
  async headers() {
    return [
      {
        // matching all API routes
        source: "/api/:path*",
        headers: [
          { key: "Access-Control-Allow-Credentials", value: "true" },
          { key: "Access-Control-Allow-Origin", value: "*" },
          { key: "Access-Control-Allow-Methods", value: "GET,OPTIONS,PATCH,DELETE,POST,PUT" },
          { key: "Access-Control-Allow-Headers", value: "X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization" },
        ]
      }
    ]
  },
};

export default nextConfig;
