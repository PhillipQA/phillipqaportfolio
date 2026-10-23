/** @type {import('next').NextConfig} */

// The site is served from the root of https://phillipqa.com, so there is no base path.
// To publish it under a sub-path again (for example a GitHub project page such as
// https://phillipqa.github.io/phillipqaportfolio/), build with
// NEXT_PUBLIC_BASE_PATH=/phillipqaportfolio.
const configuredBasePath = (process.env.NEXT_PUBLIC_BASE_PATH || '').trim().replace(/\/+$/, '')
if (configuredBasePath && !configuredBasePath.startsWith('/')) {
  throw new Error('NEXT_PUBLIC_BASE_PATH must start with "/", for example /phillipqaportfolio.')
}
const basePath = configuredBasePath

const nextConfig = {
  output: 'export',
  trailingSlash: true,
  images: {
    unoptimized: true,
  },
  basePath,
  assetPrefix: basePath,
}

export default nextConfig
