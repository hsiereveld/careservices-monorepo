/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: ['images.unsplash.com', 'via.placeholder.com'],
  },
  webpack: (config, { isServer }) => {
    // Fix for Supabase modules in Next.js 15
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      net: false,
      tls: false,
      crypto: false,
    };

    // Handle Supabase modules
    config.externals = config.externals || [];
    if (isServer) {
      config.externals.push({
        '@supabase/supabase-js': '@supabase/supabase-js',
        '@supabase/auth-helpers-nextjs': '@supabase/auth-helpers-nextjs',
        '@supabase/ssr': '@supabase/ssr',
      });
    }

    return config;
  },
}

module.exports = nextConfig 