import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import RepoClient from './repo-client'

export const dynamic = 'force-dynamic'

export default async function RepoPage({ params }: { params: Promise<{ owner: string, repo: string }> }) {
  const { owner, repo } = await params
  const fullName = `${owner}/${repo}`
  const supabase = await createClient()

  // 1. Fetch Repo
  const { data: repository, error } = await supabase
    .from('repositories')
    .select(`
      *,
      user_repositories (
        role,
        users (*)
      )
    `)
    .ilike('full_name', fullName)
    .single()

  if (error || !repository) {
    notFound()
  }

  // 2. Maintainers
  // Map user_repositories to maintainers list
  const maintainers = repository.user_repositories?.map((ur: any) => ({
    ...ur.users,
    role: ur.role
  })).filter((u: any) => u.id) || []

  // 3. History
  const { data: history } = await supabase
    .from('repo_stats_history')
    .select('*')
    .eq('repo_id', repository.id)
    .order('recorded_at', { ascending: true })

  // Transform for charts
  let chartData = history?.map((h: any) => ({
    recorded_at: h.recorded_at,
    stars: h.stars,
    forks: h.forks
  })) || []

  if (chartData.length === 0) {
    chartData.push({
      recorded_at: new Date().toISOString(),
      stars: repository.stars,
      forks: repository.forks
    })
  }

  return (
    <RepoClient 
      owner={owner}
      repoName={repo}
      repository={repository}
      maintainers={maintainers}
      chartData={chartData}
    />
  )
}
