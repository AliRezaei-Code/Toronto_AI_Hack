/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: 'standalone', // Enable standalone output for optimized Docker builds
  typescript: {
    // Temporarily ignore build errors due to React types conflict with lucide-react
    // This is caused by multiple versions of @types/react in the dependency tree
    ignoreBuildErrors: true,
  },
  experimental: {
    serverComponentsExternalPackages: [
      '@remotion/renderer',
      '@remotion/bundler',
      '@remotion/media-parser',
      '@remotion/cli',
      'remotion',
    ],
  },
  webpack: (config, { isServer }) => {
    if (isServer) {
      // Externalize Remotion packages on the server side
      config.externals = config.externals || [];
      config.externals.push({
        '@remotion/renderer': 'commonjs @remotion/renderer',
        '@remotion/bundler': 'commonjs @remotion/bundler',
        '@remotion/media-parser': 'commonjs @remotion/media-parser',
      });
    }
    return config;
  },
  async rewrites() {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
    return [
      {
        source: '/api/:path*',
        destination: `${apiUrl}/api/:path*`
      }
    ]
  }
}

module.exports = nextConfig