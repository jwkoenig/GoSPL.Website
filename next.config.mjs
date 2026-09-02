import path from 'node:path'
import os from 'node:os'

const isProd = process.env.NODE_ENV === 'production'
const basePath = isProd ? (process.env.NEXT_BASE_PATH ?? '') : ''

// Send the exported static site outside the Dropbox-synced project folder.
const distDir = process.env.NEXT_DIST_DIR ?? path.relative(process.cwd(), path.join(os.homedir(), 'Desktop', 'BUILD'))

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  distDir,
  basePath,
  trailingSlash: true,
  images: {
    unoptimized: true,
  },
  env: {
    NEXT_PUBLIC_BASEPATH: basePath,
  },
};

export default nextConfig;
