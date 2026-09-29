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
  output: 'export',
  trailingSlash: true,
  images: {
    unoptimized: true,
  },
  basePath,
  assetPrefix: basePath,
}

export default nextConfig
