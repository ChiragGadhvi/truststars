import { syncAllRepositories } from '@/actions/github'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const result = await syncAllRepositories()
    return NextResponse.json(result)
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
