import type { NextConfig } from "next";
import withNextIntl from 'next-intl/plugin';

const withIntl = withNextIntl('./src/i18n.ts');

const nextConfig: NextConfig = {
  /* config options here */
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'omlqrcqaszytiscjacai.supabase.co',
      },
    ],
  },
  output: 'standalone',
};

export default withIntl(nextConfig);
