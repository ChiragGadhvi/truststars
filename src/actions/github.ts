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

    // Check which ones are already added
    const supabase = await createClient()
    const repoFullNames = adminRepos.map(r => r.full_name)
    
    // Split into chunks if too many, but for now 100 is max per page so it fits in a query usually
    const { data: existingRepos } = await supabase
      .from('repositories')
      .select('full_name')
      .in('full_name', repoFullNames)

    const existingSet = new Set(existingRepos?.map(r => r.full_name) || [])
    
    const reposWithStatus = adminRepos.map(repo => ({
      ...repo,
      is_added: existingSet.has(repo.full_name)
    }))

    return { data: reposWithStatus }
  } catch (error) {
    console.error("Error fetching repos:", error)
    return { error: 'Failed to connect to GitHub' }
  }
}

async function githubFetch(url: string, providerToken?: string) {
  const baseHeaders: any = {
    Accept: 'application/vnd.github.v3+json',
    'User-Agent': 'TrustStars-App'
  }

  const tryFetch = async (token?: string) => {
    const headers = { ...baseHeaders }
    if (token) {
      headers.Authorization = `Bearer ${token}`
    }
    const res = await fetch(url, { headers, cache: 'no-store' })
    if (res.status === 404 && token) {
      console.warn(`404 for ${url} with token ${token.slice(0, 7)}...`)
    }
    return res
  }

  // Try 1: Provider Token (User's own token)
  if (providerToken) {
    const res = await tryFetch(providerToken)
    if (res.ok) return res
    // Fallback if token is expired (401) or rate limited (403), or if it's restricted and returns 404
    console.warn(`Provider token failed for ${url}: ${res.status}. Falling back...`)
  }

  // Try 2: App Level Access Token (Server's PAT)
  if (process.env.GITHUB_ACCESS_TOKEN) {
    const res = await tryFetch(process.env.GITHUB_ACCESS_TOKEN)
    if (res.ok) return res
    console.warn(`App token failed for ${url}: ${res.status}. Falling back...`)
  }

  // Try 3: Anonymous
  return tryFetch()
}

export async function checkRepo(repoFullName: string, providerToken?: string) {
  const res = await githubFetch(`https://api.github.com/repos/${repoFullName}`, providerToken)
  if (!res.ok) {
    if (res.status === 403) return { error: `GitHub Rate limit reached. The app needs a 'Classic PAT' in .env to fetch public data more reliably.` }
    return { error: 'Repository not found or private.' }
  }
  return { data: await res.json() }
}

export async function addRepository(repoFullName: string, providerToken?: string, customData?: { description?: string, imageUrl?: string }) {
  const supabase = await createClient(true) // Use service role for admin tasks
  const { data: { user } } = await supabase.auth.getUser()

  // Ensure user profile exists if user is logged in
  if (user) {
    const { createAdminClient } = await import('@/lib/supabase/admin')
    const adminClient = createAdminClient()
    
    await adminClient
      .from('users')
      .upsert({
         id: user.id,
         github_username: user.user_metadata?.user_name || user.email?.split('@')[0],
         avatar_url: user.user_metadata?.avatar_url, 
         display_name: user.user_metadata?.full_name || user.user_metadata?.name || user.email?.split('@')[0],
         updated_at: new Date().toISOString()
      }, { onConflict: 'id' })
  }

  const today = new Date()
  const thirtyDaysAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString()

  // 1. Fetch repo details
  const res = await githubFetch(`https://api.github.com/repos/${repoFullName}`, providerToken)
  
  if (!res.ok) {
    if (res.status === 403) {
      return { error: 'GitHub API rate limit exceeded. Please try again later or sign in with GitHub.' }
    }
    const err = await res.text()
    console.error("GitHub Fetch Error:", err)
    return { error: 'Failed to fetch repo details. Make sure the URL is correct and the repo is public.' }
  }
  const githubRepo: any = await res.json()

  // 1b. Fetch owner details for display name
  let ownerDisplayName = githubRepo.owner.login
  try {
    const ownerRes = await githubFetch(`https://api.github.com/users/${githubRepo.owner.login}`, providerToken)
    if (ownerRes.ok) {
      const ownerData = await ownerRes.json()
      ownerDisplayName = ownerData.name || ownerData.login
    }
  } catch (e) {
    console.error("Error fetching owner profile:", e)
  }

  // Verify permission only if authenticated with GitHub
  let isVerified = false
  if (providerToken && githubRepo.permissions) {
    if (githubRepo.permissions.admin || githubRepo.permissions.maintain) {
      isVerified = true
    }
  }

  // 2. Fetch Activity Signals
  let recentCommitsCount = 0
  let activeContributorsCount = 0
  let lastCommitAt = null
  let recentPrsOpened = 0
  let recentPrsMerged = 0

  try {
    // A. Commits in last 30 days
    const commitsRes = await githubFetch(`https://api.github.com/repos/${repoFullName}/commits?since=${thirtyDaysAgo}&per_page=100`, providerToken)
    if (commitsRes.ok) {
      const commits = await commitsRes.json()
      recentCommitsCount = Array.isArray(commits) ? commits.length : 0
      if (recentCommitsCount > 0) {
        lastCommitAt = commits[0].commit.committer.date
        const uniqueAuthors = new Set()
        commits.forEach((c: any) => {
          if (c.author?.login) uniqueAuthors.add(c.author.login)
          else if (c.commit?.author?.email) uniqueAuthors.add(c.commit.author.email)
        })
        activeContributorsCount = uniqueAuthors.size
      }
    }
    
    // B. PRs Opened
    const prsOpenedRes = await githubFetch(`https://api.github.com/search/issues?q=repo:${repoFullName}+is:pr+created:>${thirtyDaysAgo}`, providerToken)
    if (prsOpenedRes.ok) {
      const data = await prsOpenedRes.json()
      recentPrsOpened = data.total_count
    }

    // C. PRs Merged
    const prsMergedRes = await githubFetch(`https://api.github.com/search/issues?q=repo:${repoFullName}+is:pr+merged:>${thirtyDaysAgo}`, providerToken)
    if (prsMergedRes.ok) {
        const data = await prsMergedRes.json()
        recentPrsMerged = data.total_count
    }
  } catch (e) {
    console.error("Error fetching activity stats:", e)
  }

  // 3. Compute Activity Score
  let score = (activeContributorsCount * 10) + (recentCommitsCount * 0.5) + (recentPrsMerged * 5) + (recentPrsOpened * 1)
  if (lastCommitAt) {
    const hoursSinceLastCommit = (new Date().getTime() - new Date(lastCommitAt).getTime()) / (1000 * 60 * 60)
    if (hoursSinceLastCommit < 48) score *= 1.2
    else if (hoursSinceLastCommit > 14 * 24) score *= 0.5
  }
  score = Math.round(score * 100) / 100

  // 4. Insert into repositories
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
      contributors: activeContributorsCount,
      language: githubRepo.language,
      verified_at: isVerified ? new Date().toISOString() : null,
      last_synced_at: new Date().toISOString(),
      activity_score: score,
      recent_commits_count: recentCommitsCount,
      recent_prs_opened_count: recentPrsOpened,
      recent_prs_merged_count: recentPrsMerged,
      recent_contributors_count: activeContributorsCount,
      last_commit_at: lastCommitAt,
      // More details
      open_issues_count: githubRepo.open_issues_count,
      topics: githubRepo.topics || [],
      license_name: githubRepo.license?.name || githubRepo.license?.spdx_id,
      homepage: githubRepo.homepage,
      subscribers_count: githubRepo.subscribers_count,
      network_count: githubRepo.network_count,
      owner_avatar_url: githubRepo.owner.avatar_url,
      owner_id_github: githubRepo.owner.id,
      owner_display_name: ownerDisplayName
    }, { onConflict: 'full_name' })
    .select()
    .single()

  if (repoError) return { error: repoError.message }

  // 5. Link to user ONLY if user is logged in
  if (user) {
    const { error: linkError } = await supabase
      .from('user_repositories')
      .upsert({
        user_id: user.id,
        repo_id: insertedRepo.id,
        role: isVerified ? (githubRepo.permissions?.admin ? 'owner' : 'maintainer') : 'maintainer'
      }, { onConflict: 'user_id,repo_id' })

    if (linkError) return { error: linkError.message }
  }

  // 6. Stats history
  await supabase.from('repo_stats_history').insert({
    repo_id: insertedRepo.id,
    stars: githubRepo.stargazers_count,
    forks: githubRepo.forks_count,
    contributors: activeContributorsCount, 
    activity_score: score,
    recent_commits_count: recentCommitsCount
  })

  revalidatePath('/dashboard')
  revalidatePath('/') 
  return { success: true }
}


export async function addRepositoryByUrl(url: string) {
  // Extract owner/repo from URL
  // Matches: https://github.com/owner/repo or github.com/owner/repo or owner/repo
  const match = url.match(/(?:github\.com\/)?([^/]+)\/([^/]+?)(?:\.git|\/)?$/)
  if (!match) return { error: "Invalid GitHub URL format" }
  
  const owner = match[1]
  const repo = match[2]
  const fullName = `${owner}/${repo}`

  const supabase = await createClient()
  const { data: { session } } = await supabase.auth.getSession()

  // Use provider token if available (to increase rate limits and check permissions)
  return addRepository(fullName, session?.provider_token ?? undefined)
}

export async function syncAllRepositories() {
  const supabase = await createClient(true) // Use service role for sync
  
  const { data: repos, error } = await supabase.from('repositories').select('full_name, id')
  
  if (error) return { error: error.message }
  if (!repos || repos.length === 0) return { success: true, message: "No repositories to sync" }

  const results = {
    total: repos.length,
    success: 0,
    failed: 0
  }

  for (const repo of repos) {
    try {
      const res = await githubFetch(`https://api.github.com/repos/${repo.full_name}`)

      if (!res.ok) {
        const errorText = await res.text()
        console.error(`GitHub API error for ${repo.full_name}: ${res.status} ${errorText}`)
        results.failed++
        continue
      }

      if (res.ok) {
        const githubRepo = await res.json()

        let ownerDisplayName = githubRepo.owner.login
        try {
          const ownerRes = await githubFetch(`https://api.github.com/users/${githubRepo.owner.login}`)
          if (ownerRes.ok) {
            const ownerData = await ownerRes.json()
            ownerDisplayName = ownerData.name || ownerData.login
          }
        } catch (e) {}
        
        await supabase.from('repositories').update({
          stars: githubRepo.stargazers_count,
          forks: githubRepo.forks_count,
          last_synced_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          open_issues_count: githubRepo.open_issues_count,
          topics: githubRepo.topics || [],
          license_name: githubRepo.license?.name || githubRepo.license?.spdx_id,
          homepage: githubRepo.homepage,
          subscribers_count: githubRepo.subscribers_count,
          network_count: githubRepo.network_count,
          owner_avatar_url: githubRepo.owner.avatar_url,
          owner_id_github: githubRepo.owner.id,
          owner_display_name: ownerDisplayName
        }).eq('id', repo.id)

        // Also record history
        await supabase.from('repo_stats_history').insert({
          repo_id: repo.id,
          stars: githubRepo.stargazers_count,
          forks: githubRepo.forks_count,
          recorded_at: new Date().toISOString()
        })

        results.success++
      } else {
        results.failed++
      }
    } catch (e) {
      console.error(`Sync failed for ${repo.full_name}:`, e)
      results.failed++
    }
  }

  revalidatePath('/')
  revalidatePath('/dashboard')
  return { success: true, results }
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
  // Use admin client to bypass possible RLS delete restrictions for users
  const { createAdminClient } = await import('@/lib/supabase/admin')
  const adminClient = createAdminClient()
  
  const { error: linkError } = await adminClient
    .from('user_repositories')
    .delete()
    .eq('user_id', user.id)
    .eq('repo_id', repoId)

  if (linkError) {
    console.error("Delete link error:", linkError)
    return { error: 'Failed to remove repository from your account' }
  }

  // 2. Cleanup orphaned repos
  const { count } = await supabase
    .from('user_repositories')
    .select('*', { count: 'exact', head: true })
    .eq('repo_id', repoId)
  
  if (count === 0) {
      await adminClient
        .from('repositories')
        .delete()
        .eq('id', repoId)
  }

  revalidatePath('/dashboard/repos')
  revalidatePath('/dashboard')
  revalidatePath('/')
  return { success: true }
}

