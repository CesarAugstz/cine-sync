import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs/promises'
import path from 'path'

const MOVIES_DIR = process.env.MOVIES_DIR || '/path/to/your/movies'

export async function GET(
  _: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  try {
    const { path: pathParam } = await params
    const filePath = path.join(MOVIES_DIR, ...pathParam.map(decodeURIComponent))
    
    const content = await fs.readFile(filePath, 'utf-8')
    
    return new NextResponse(content, {
      headers: {
        'Content-Type': 'text/vtt; charset=utf-8',
        'Cache-Control': 'public, max-age=31536000',
      },
    })
  } catch (error) {
    console.error('Error loading subtitle:', error)
    return new NextResponse('Subtitle file not found', { status: 404 })
  }
}
