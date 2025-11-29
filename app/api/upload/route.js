import { NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';

export async function POST(request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file');
    
    if (!file) {
      return NextResponse.json(
        { success: false, error: '沒有選擇檔案' },
        { status: 400 }
      );
    }

    // 檢查檔案類型
    const allowedTypes = ['.csv', '.xlsx', '.xls'];
    const fileExtension = path.extname(file.name).toLowerCase();
    
    if (!allowedTypes.includes(fileExtension)) {
      return NextResponse.json(
        { success: false, error: '不支援的檔案格式，請上傳 CSV 或 Excel 檔案' },
        { status: 400 }
      );
    }

    // 讀取檔案內容
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // 確保上傳目錄存在
    const uploadDir = path.join(process.cwd(), 'public', 'uploads');
    if (!existsSync(uploadDir)) {
      await mkdir(uploadDir, { recursive: true });
    }

    // 儲存檔案
    const fileName = file.name;
    const filePath = path.join(uploadDir, fileName);
    await writeFile(filePath, buffer);

    return NextResponse.json({
      success: true,
      message: '檔案上傳成功',
      fileName: fileName,
      filePath: `/uploads/${fileName}`
    });
  } catch (error) {
    console.error('檔案上傳錯誤:', error);
    return NextResponse.json(
      { success: false, error: '檔案上傳失敗: ' + error.message },
      { status: 500 }
    );
  }
}

