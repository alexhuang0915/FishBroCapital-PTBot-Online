import { NextResponse } from 'next/server';

// Edge Runtime 配置
export const runtime = 'edge';

// Edge Runtime 不支持文件系統寫入
// 文件上傳功能在 Cloudflare Pages 上需要通過其他方式實現（如 Cloudflare R2）
export async function POST(request) {
  return NextResponse.json(
    { 
      success: false, 
      error: '檔案上傳功能在 Cloudflare Pages 上不可用。請使用本地預處理方式更新數據：npm run preprocess' 
    },
    { status: 501 }
  );
}

