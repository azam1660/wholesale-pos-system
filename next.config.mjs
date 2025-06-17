/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  output: 'export',            // Required for static export
  images: {
    unoptimized: true,         // Required for export mode
  },
};

export default nextConfig;
