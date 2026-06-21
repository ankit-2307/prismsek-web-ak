/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // three/examples/jsm modules (GLTFLoader, DRACOLoader) ship as untranspiled ESM.
  transpilePackages: ["three"],
};

module.exports = nextConfig;
