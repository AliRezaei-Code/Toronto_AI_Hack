/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  experimental: {
    optimizePackageImports: ["lucide-react"],
    serverComponentsExternalPackages: [
      "fluent-ffmpeg",
      "@ffmpeg-installer/ffmpeg",
      "@ffprobe-installer/ffprobe",
      "better-sqlite3",
      "winston",
    ],
  },
  webpack: (config, { isServer }) => {
    if (!isServer) {
      // Don't bundle Node.js modules for client-side
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        path: false,
        "fs/promises": false,
      };
    }
    config.externals.push({
      "utf-8-validate": "commonjs utf-8-validate",
      bufferutil: "commonjs bufferutil",
      "fluent-ffmpeg": "commonjs fluent-ffmpeg",
      "@ffmpeg-installer/ffmpeg": "commonjs @ffmpeg-installer/ffmpeg",
      "@ffprobe-installer/ffprobe": "commonjs @ffprobe-installer/ffprobe",
      "better-sqlite3": "commonjs better-sqlite3",
      winston: "commonjs winston",
      fs: "commonjs fs",
      "fs/promises": "commonjs fs/promises",
      path: "commonjs path",
    });
    return config;
  },
  typescript: {
    ignoreBuildErrors: false,
  },
  eslint: {
    ignoreDuringBuilds: false,
  },
};

module.exports = nextConfig;
