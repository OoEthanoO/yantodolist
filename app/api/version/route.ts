import { NextResponse } from 'next/server'
import { APP_VERSION } from '@/lib/version'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const fetchCache = 'force-no-store'

export async function GET() {
  return NextResponse.json({ version: APP_VERSION })
}
