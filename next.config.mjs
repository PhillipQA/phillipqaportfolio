/** @type {import('next').NextConfig} */

// When building on GitHub Actions, GITHUB_REPOSITORY looks like "username/repo-name".
// Project pages (username.github.io/repo-name) are served from a sub-path, so we need
// to tell Next.js about that sub-path. User/org pages (a repo literally named
// "username.github.io") are served from the domain root, so no basePath is needed.
const isGithubActions = process.env.GITHUB_ACTIONS === 'true'
let basePath = ''

if (isGithubActions && process.env.GITHUB_REPOSITORY) {
  const repoName = process.env.GITHUB_REPOSITORY.split('/')[1]
  if (repoName && !repoName.endsWith('.github.io')) {
    basePath = `/${repoName}`
  }
}

const nextConfig = {
  // Produces a plain static site (an `out/` folder of HTML/CSS/JS) instead of
  // a Node server, which is what GitHub Pages can actually host.
  output: 'export',
  // Static export doesn't have Next's rewrite engine, so every route needs its
  // own index.html for GitHub Pages to serve it correctly.
  trailingSlash: true,
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  basePath,
  assetPrefix: basePath,
}

export default nextConfig
