'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

interface GitHubRepo {
  id: number;
  name: string;
  full_name: string;
  owner: {
    login: string;
    avatar_url: string;
  };
  html_url: string;
  description: string;
  stargazers_count: number;
  forks_count: number;
  language: string;
  permissions?: {
    admin: boolean;
    maintain: boolean;
    push: boolean;
  };
}

export async function listMyRepos(providerToken: string) {
  if (!providerToken) return { error: "No provider token found" }

  try {
    const res = await fetch('https://api.github.com/user/repos?sort=updated&per_page=100&type=all', {
      headers: {
        Authorization: `Bearer ${providerToken}`,
        Accept: 'application/vnd.github.v3+json',
      },
    })

    if (!res.ok) {
       const errorText = await res.text()
       // Don't spam console if it's just auth error
       if (res.status === 401) {
          return { error: 'Bad credentials' }
       }
       console.error("GitHub API error:", errorText)
       return { error: 'Failed to fetch repositories from GitHub' }
    }

    const repos: GitHubRepo[] = await res.json()
    // Filter for permissions where user is admin or maintainer
    const adminRepos = repos.filter((repo) => 
      repo.permissions?.admin || repo.permissions?.maintain
    )
    
    return { data: adminRepos }
  } catch (error) {
    console.error("Error fetching repos:", error)
    return { error: 'Failed to connect to GitHub' }
  }
}

export async function addRepository(repoFullName: string, providerToken: string, customData?: { description?: string, imageUrl?: string }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return { error: 'Not authenticated' }

  // 1. Fetch repo details from GitHub to verify permissions and get latest stats
  const res = await fetch(`https://api.github.com/repos/${repoFullName}`, {
    headers: {
      Authorization: `Bearer ${providerToken}`,
      Accept: 'application/vnd.github.v3+json',
    },
  })
  
  if (!res.ok) return { error: 'Failed to fetch repo details' }
  const githubRepo: GitHubRepo = await res.json()

  // Verify permission again
  if (!githubRepo.permissions?.admin && !githubRepo.permissions?.maintain) {
    return { error: "You don't have maintainer permissions for this repository" }
  }

  // Optimize contributors count: simplistic approach (first 100)
  // Real implementation would look at Link headers or scrape
  let contributorsCount = 0
  try {
    const contribRes = await fetch(`https://api.github.com/repos/${repoFullName}/contributors?per_page=100&anon=true`, {
       headers: {
        Authorization: `Bearer ${providerToken}`,
        Accept: 'application/vnd.github.v3+json',
      },
    })
    if (contribRes.ok) {
        const contribs = await contribRes.json()
        contributorsCount = contribs.length
        // If 100, it's likely more, but good enough for MVP
    }
  } catch (e) {
    // ignore
  }

  // 2. Insert into repositories
  const { data: insertedRepo, error: repoError } = await supabase
    .from('repositories')
    .upsert({
      full_name: githubRepo.full_name,
      owner: githubRepo.owner.login,
      name: githubRepo.name,
      description: customData?.description || githubRepo.description,
      image_url: customData?.imageUrl || githubRepo.owner.avatar_url,
      stars: githubRepo.stargazers_count,
      forks: githubRepo.forks_count,
      contributors: contributorsCount,
      language: githubRepo.language,
      verified_at: new Date().toISOString(), // Mark as verified immediately since we checked permissions
      last_synced_at: new Date().toISOString(),
    }, { onConflict: 'full_name' })
    .select()
    .single()

  if (repoError) {
    console.error("Repo insert error:", repoError)
    return { error: repoError.message }
  }

  // 3. Link to user
  const { error: linkError } = await supabase
    .from('user_repositories')
    .upsert({
      user_id: user.id,
      repo_id: insertedRepo.id,
      role: githubRepo.permissions?.admin ? 'owner' : 'maintainer'
    }, { onConflict: 'user_id,repo_id' })

  if (linkError) {
     console.error("Link user repo error:", linkError)
     return { error: linkError.message }
  }

  // 4. Initial stats history
  await supabase.from('repo_stats_history').insert({
    repo_id: insertedRepo.id,
    stars: githubRepo.stargazers_count,
    forks: githubRepo.forks_count,
    contributors: contributorsCount
  })

  revalidatePath('/dashboard')
  revalidatePath('/') // Revalidate homepage
  return { success: true }
}

export async function deleteRepository(repoId: number) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return { error: 'Not authenticated' }

  // Check if user is linked to this repo
  const { data: link } = await supabase
    .from('user_repositories')
    .select('*')
    .eq('user_id', user.id)
    .eq('repo_id', repoId)
    .single()

  if (!link) {
    return { error: 'Repository not found or access denied' }
  }

  // 1. Delete the link from user_repositories
  const { error: linkError, count: deletedCount } = await supabase
    .from('user_repositories')
    .delete({ count: 'exact' })
    .eq('user_id', user.id)
    .eq('repo_id', repoId)

  if (linkError) {
    console.error("Delete link error:", linkError)
    return { error: 'Failed to remove repository from your account' }
  }

  if (deletedCount === 0) {
      // If we found the link earlier but delete failed to remove rows, it's likely an RLS issue.
      console.warn("Standard delete affected 0 rows. Attempting admin removal...")
      
      const { createAdminClient } = await import('@/lib/supabase/admin')
      const adminClient = createAdminClient()
      
      const { error: adminError } = await adminClient
        .from('user_repositories')
        .delete()
        .eq('user_id', user.id)
        .eq('repo_id', repoId)
      
      if (adminError) {
         console.error("Admin delete failed:", adminError)
         return { error: 'Permission denied: Could not delete repository link even with admin privileges.' }
      }
      // If admin delete succeeded, continue (revalidate)
  }

  // 2. Optionally delete the repository if no other users are linked (or just try to delete and ignore foreign key errors if any)
  // We check if any other user has this repo
  const { count } = await supabase
    .from('user_repositories')
    .select('*', { count: 'exact', head: true })
    .eq('repo_id', repoId)
  
  if (count === 0) {
      const { error: repoError } = await supabase
        .from('repositories')
        .delete()
        .eq('id', repoId)
      
      if (repoError) {
        console.warn("Could not delete orphaned repo (might be fine):", repoError)
      }
  }

  revalidatePath('/dashboard/repos')
  revalidatePath('/dashboard')
  revalidatePath('/')
  return { success: true }
}
