/**
 * @type {import('next').NextConfig}
 */
const nextConfig = {
  images: {
    localPatterns: [
      {
        // We use the query string to guarantee a fresh request
        pathname: '/test?*',
      },
      {
        pathname: '/will-never-exist',
      },
      {
        pathname: '/still-doesnt-exist',
      },
    ],
  },
}

module.exports = nextConfig
