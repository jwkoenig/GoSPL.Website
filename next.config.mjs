const isProd = process.env.NODE_ENV === 'production'
const basePath = isProd ? '/BETA' : ''

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
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
