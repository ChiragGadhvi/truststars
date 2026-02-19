import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import DeveloperClient from './developer-client'

export const dynamic = 'force-dynamic'

export default async function DeveloperPage({ params }: { params: Promise<{ username: string }> }) {
  const { username } = await params
  const supabase = await createClient()

  // 1. Try to find an actual registered user
  const { data: userData, error: userError } = await supabase
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
    .ilike('github_username', username)
    .maybeSingle()

  if (userError) {
     console.error("Error fetching user data:", userError);
  }

  let finalUser = userData
  let reposList = []

  if (userData) {
    // Transform data for registered user
    reposList = (userData.user_repositories
      ?.map((ur: any) => ur.repositories)
      .filter(Boolean) || []) as any[]
  } else {
    // 2. Fallback: Check repositories table for this owner to build a "Virtual Profile"
    const { data: ownerRepos, error: ownerReposError } = await supabase
      .from('repositories')
      .select('*')
      .ilike('owner', username)
      .order('stars', { ascending: false })

    if (!ownerRepos || ownerRepos.length === 0) {
      notFound()
    }

    // Build virtual user profile from repository data
    const firstRepo = ownerRepos[0]
    finalUser = {
      github_username: username,
      avatar_url: firstRepo.owner_avatar_url || `https://github.com/${username}.png`,
      display_name: firstRepo.owner_display_name || username,
      bio: null, // Virtual profiles don't have bios yet
      twitter_handle: firstRepo.twitter_handle,
      linkedin_url: firstRepo.linkedin_url,
      website_url: firstRepo.website_url
    }
    reposList = ownerRepos
  }

  // Calculate aggregated stats
  const totalStars = reposList.reduce((sum: number, repo: any) => sum + (repo.stars || 0), 0)
  const totalForks = reposList.reduce((sum: number, repo: any) => sum + (repo.forks || 0), 0)

  return (
    <DeveloperClient 
      username={username}
      user={finalUser}
      repos={reposList}
      totalStars={totalStars}
      totalForks={totalForks}
    />
  )
}
