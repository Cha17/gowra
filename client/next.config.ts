import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    domains: ['drive.google.com', 'lh3.googleusercontent.com'],
  },
  serverExternalPackages: ['@stackframe/react'],
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080',
  },
    // Disable webpack cache for production builds
    webpack: (config, { dev }) => {
      if (!dev) {
        config.cache = false;
      }
      return config;
    },
    // Or alternatively, configure cache location
    distDir: '.next',
    generateBuildId: async () => {
      return 'build-' + Date.now();
    }
};

export default nextConfig;
