import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import DeveloperClient from './developer-client'

export const dynamic = 'force-dynamic'

export default async function DeveloperPage({ params }: { params: Promise<{ username: string }> }) {
  const { username } = await params
  const supabase = await createClient()

  // Fetch user data
  const { data: userData } = await supabase
    .from('users')
    .select('*')
    .eq('github_username', username)
    .single()

  if (!userData) {
    notFound()
  }

  // Fetch user's repositories
  const { data: userRepos } = await supabase
    .from('user_repositories')
    .select(`
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
    `)
    .eq('user_id', userData.id)

  const reposList = userRepos?.map((ur: any) => ur.repositories).filter(Boolean) || []

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
