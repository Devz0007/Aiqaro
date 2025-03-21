/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    // Warning instead of error during builds
    ignoreDuringBuilds: true,
  },
  typescript: {
    // Allow production builds to successfully complete even if
    // your project has type errors
    ignoreBuildErrors: true,
  },
  // Add other configurations here as needed
};

module.exports = nextConfig; 