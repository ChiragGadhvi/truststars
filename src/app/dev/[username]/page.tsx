import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import DeveloperClient from './developer-client'

export const dynamic = 'force-dynamic'

export default async function DeveloperPage({ params }: { params: Promise<{ username: string }> }) {
  const { username } = await params
  const supabase = await createClient()

  // Optimize data fetching: Get user and their repos in a single query
  const { data: userData } = await supabase
    .from('users')
    .select(`
      *,
      user_repositories (
        repositories (
          id,
          full_name,
          name,
          description,
          image_url,
          stars,
          forks,
          language
        )
      )
    `)
    .eq('github_username', username)
    .single()

  if (!userData) {
    notFound()
  }

  // Transform data
  const reposList = userData.user_repositories
    ?.map((ur: any) => ur.repositories)
    .filter(Boolean) || []

  // Calculate aggregated stats
  const totalStars = reposList.reduce((sum: number, repo: any) => sum + (repo.stars || 0), 0)
  const totalForks = reposList.reduce((sum: number, repo: any) => sum + (repo.forks || 0), 0)

  return (
    <DeveloperClient 
      username={username}
      user={userData}
      repos={reposList}
      totalStars={totalStars}
      totalForks={totalForks}
    />
  )
}
