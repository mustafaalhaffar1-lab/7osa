/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Keep native/server-only barcode libs out of the client bundle.
  serverExternalPackages: ["bwip-js", "bwip-js/node", "qrcode"],
  images: {
    remotePatterns: [
      // Supabase Storage public buckets (item photos)
      { protocol: "https", hostname: "*.supabase.co" },
    ],
  },
};

export default nextConfig;
