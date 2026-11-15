/** @type {import('next').NextConfig} */
const nextConfig = {
  // Speed up production builds: type checking is handled via `pnpm check-types`
  typescript: {
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
