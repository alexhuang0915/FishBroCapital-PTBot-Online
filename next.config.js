/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Cloudflare Pages 優化配置
  // 確保 API 路由和靜態文件正常工作
  trailingSlash: false,
}

module.exports = nextConfig

