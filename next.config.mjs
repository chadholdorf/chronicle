/** @type {import('next').NextConfig} */
const nextConfig = {
  // Allow external images for favicons
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "www.google.com",
        pathname: "/s2/favicons/**",
      },
    ],
  },
  // Ensure better-sqlite3 is not bundled by webpack (it's a native module)
  webpack: (config, { isServer }) => {
    if (isServer) {
      config.externals = [...(config.externals ?? []), "better-sqlite3"];
    }
    return config;
  },
};

export default nextConfig;
