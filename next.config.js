/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  compress: true,
  experimental: {
    optimizePackageImports: ['@supabase/supabase-js', 'framer-motion', 'lucide-react'],
  },
}

module.exports = nextConfig
