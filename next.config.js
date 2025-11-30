/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Cloudflare Pages 配置
  trailingSlash: false,
  // 確保輸出兼容 Cloudflare Pages
  output: undefined, // 讓 Cloudflare Pages 自動處理
}

module.exports = nextConfig

