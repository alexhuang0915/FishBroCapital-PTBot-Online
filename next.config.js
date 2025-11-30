/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Cloudflare Pages 配置
  trailingSlash: false,
  // 確保輸出兼容 Cloudflare Pages
  output: undefined, // 讓 Cloudflare Pages 自動處理
  
  // 禁用構建緩存以減少文件大小（Cloudflare Pages 25MB 限制）
  ...(process.env.CI && {
    webpack: (config, { isServer }) => {
      // 在 CI 環境中禁用緩存
      if (isServer) {
        config.cache = false;
      }
      return config;
    },
  }),
}

module.exports = nextConfig

