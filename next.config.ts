import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin();

const nextConfig: NextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '3001',
        pathname: '/**'
      },
      {
        protocol: 'https',
        hostname: 'api.biztorg.uz',
        pathname: '/**'
      }
    ]
  }
};

export default withNextIntl(nextConfig);