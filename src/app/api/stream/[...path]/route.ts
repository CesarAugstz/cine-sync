import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

const MOVIES_DIR = process.env.MOVIES_DIR
const CHUNK_SIZE = 1024 * 1024 * 2 // 2MB chunks

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  try {
    const { path: pathParam } = await params

    if (!MOVIES_DIR) {
      return new NextResponse('Server configuration error', { status: 500 })
    }

    const filePath = path.join(MOVIES_DIR, ...pathParam.map(decodeURIComponent))
    
    if (!fs.existsSync(filePath)) {
      return new NextResponse('File not found', { status: 404 })
    }

    const stat = fs.statSync(filePath)
    const fileSize = stat.size
    const range = request.headers.get('range')

    const ext = path.extname(filePath).toLowerCase()
    const mimeTypes: Record<string, string> = {
      '.mp4': 'video/mp4',
      '.mkv': 'video/x-matroska',
      '.avi': 'video/x-msvideo',
      '.mov': 'video/quicktime',
      '.webm': 'video/webm'
    }
    const contentType = mimeTypes[ext] || 'video/mp4'

    if (range) {
      const parts = range.replace(/bytes=/, "").split("-")
      const start = parseInt(parts[0], 10)
      let end = parts[1] ? parseInt(parts[1], 10) : Math.min(start + CHUNK_SIZE - 1, fileSize - 1)
      
      end = Math.min(end, fileSize - 1)
      
      const chunksize = (end - start) + 1
      
      const file = fs.createReadStream(filePath, { start, end })
      
      return new NextResponse(file as any, {
        status: 206,
        headers: {
          'Content-Range': `bytes ${start}-${end}/${fileSize}`,
          'Accept-Ranges': 'bytes',
          'Content-Length': chunksize.toString(),
          'Content-Type': contentType,
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0',
        },
      })
    } else {
      const file = fs.createReadStream(filePath)
      return new NextResponse(file as any, {
        headers: {
          'Content-Length': fileSize.toString(),
          'Content-Type': contentType,
          'Accept-Ranges': 'bytes',
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0',
        },
      })
    }
  } catch (error) {
    console.error('Error streaming file:', error)
    return new NextResponse('Internal server error', { status: 500 })
  }
}
