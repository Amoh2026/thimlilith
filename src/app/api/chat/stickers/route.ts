// src/app/api/chat/stickers/route.ts
import { NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

export async function GET() {
  try {
    const basePath = path.join(process.cwd(), 'public', 'stickers');
    
    const getFiles = async (folder: string) => {
      const dirPath = path.join(basePath, folder);
      try {
        const files = await fs.readdir(dirPath);
        const validFiles = [];
        for (const file of files) {
          if (/\.(png|jpe?g|webp|gif|svg)$/i.test(file)) {
            const stats = await fs.stat(path.join(dirPath, file));
            if (stats.size > 0) { // Only include files > 0 bytes
              validFiles.push(file);
            }
          }
        }
        return validFiles;
      } catch (error) {
        return []; // Folder doesn't exist
      }
    };

    const emotions = await getFiles('emotions');
    const identity = await getFiles('identity');

    // Return with headers to prevent Next.js from caching the folder list
    return NextResponse.json({ emotions, identity }, {
      headers: { 'Cache-Control': 'no-store' }
    });
  } catch (error) {
    return NextResponse.json({ emotions: [], identity: [] }, { status: 500 });
  }
}