/** @type {import('next').NextConfig} */

const nextConfig = {
  typescript: {
    // TEMPORARY: allows production build while we investigate
    // the TypeScript memory issue after the presentation.
    ignoreBuildErrors: true,
  },

  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
      },
    ],
  },
}

module.exports = nextConfig