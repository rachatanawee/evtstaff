import type { NextConfig } from "next";
import withNextIntl from 'next-intl/plugin';

const withIntl = withNextIntl('./src/i18n.ts');

const nextConfig: NextConfig = {
  /* config options here */
  images: {
    domains: ['omlqrcqaszytiscjacai.supabase.co'],
  },
};

export default withIntl(nextConfig);
