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
  // Add Clerk configuration
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'Access-Control-Allow-Origin',
            value: '*',
          },
          {
            key: 'Access-Control-Allow-Methods',
            value: 'GET,OPTIONS,PATCH,DELETE,POST,PUT',
          },
        ],
      },
    ];
  },
  // Add other configurations here as needed
};

module.exports = nextConfig; 