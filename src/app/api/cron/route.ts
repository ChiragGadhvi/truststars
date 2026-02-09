
import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

// Vercel Cron uses GET usually, or POST
export async function GET(request: Request) {
  // Simple auth protection
  const authHeader = request.headers.get('authorization')
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new NextResponse('Unauthorized', { status: 401 })
  }

  // Use service role key to bypass RLS
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY || ''
  )

  // 1. Fetch all repos to update
  const { data: repos, error } = await supabase.from('repositories').select('id, full_name, contributors')
  
  if (error || !repos) {
    return NextResponse.json({ error: error?.message || 'No repos found' }, { status: 500 })
  }

  let updatedCount = 0

  // 2. Loop and update (in production use a queue or limit batch size)
  for (const repo of repos) {
     try {
       // Use a system GITHUB_TOKEN from env for higher rate limits
       const headers: HeadersInit = {
           Accept: 'application/vnd.github.v3+json',
       }
       if (process.env.GITHUB_TOKEN) {
           headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`
       }

       const res = await fetch(`https://api.github.com/repos/${repo.full_name}`, { headers })
       
       if (res.ok) {
         const data = await res.json()
         
         // Update DB
         await supabase.from('repositories').update({
           stars: data.stargazers_count,
           forks: data.forks_count,
           // language: data.language, // Optional update
           last_synced_at: new Date().toISOString()
         }).eq('id', repo.id)
         
         // Add history
         await supabase.from('repo_stats_history').insert({
           repo_id: repo.id,
           stars: data.stargazers_count,
           forks: data.forks_count,
           contributors: repo.contributors
         })
         
         updatedCount++
       } else {
         console.error(`Failed to fetch ${repo.full_name}: ${res.status}`)
       }
     } catch (e) {
       console.error(`Failed to sync ${repo.full_name}`, e)
     }
  }

  return NextResponse.json({ success: true, count: repos.length, updated: updatedCount })
}
