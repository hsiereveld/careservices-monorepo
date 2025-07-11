/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    appDir: true,
  },
  images: {
    domains: ['example.com'], // Add your image domains
  },
  async rewrites() {
    return [
      // API rewrites if needed
    ]
  }
}

module.exports = nextConfig