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
};

export default nextConfig;
