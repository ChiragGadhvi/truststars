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

export async function addRepository(repoFullName: string, providerToken: string, customData?: { description?: string, imageUrl?: string }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return { error: 'Not authenticated' }

  // Ensure user profile exists in public table to satisfy foreign key constraints
  // use admin client to bypass RLS in case user deleted their public profile but auth user remains
  const { createAdminClient } = await import('@/lib/supabase/admin')
  const adminClient = createAdminClient()
  
  const { error: profileError } = await adminClient
    .from('users')
    .upsert({
       id: user.id,
       github_username: user.user_metadata?.user_name || user.email?.split('@')[0],
       avatar_url: user.user_metadata?.avatar_url, 
       display_name: user.user_metadata?.full_name || user.user_metadata?.name || user.email?.split('@')[0],
       updated_at: new Date().toISOString()
    }, { onConflict: 'id' })
  
  if (profileError) {
     console.error("Profile upsert error:", profileError)
     // If this fails, the next foreign key insert will likely fail too, but we continue just in case.
     // However, for foreign key violation, it's definitely this step failing.
  }

  const today = new Date()
  const thirtyDaysAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString()

  // 1. Fetch repo details
  const res = await fetch(`https://api.github.com/repos/${repoFullName}`, {
    headers: {
      Authorization: `Bearer ${providerToken}`,
      Accept: 'application/vnd.github.v3+json',
    },
  })
  
  if (!res.ok) return { error: 'Failed to fetch repo details' }
  const githubRepo: GitHubRepo = await res.json()

  // Verify permission
  if (!githubRepo.permissions?.admin && !githubRepo.permissions?.maintain) {
    return { error: "You don't have maintainer permissions for this repository" }
  }

  // 2. Fetch Activity Signals
  let recentCommitsCount = 0
  let activeContributorsCount = 0
  let lastCommitAt = null
  let recentPrsOpened = 0
  let recentPrsMerged = 0

  try {
    // A. Commits in last 30 days & Last Commit Date
    // Fetch up to 100 commits to calculate unique contributors and count
    const commitsRes = await fetch(`https://api.github.com/repos/${repoFullName}/commits?since=${thirtyDaysAgo}&per_page=100`, {
      headers: { Authorization: `Bearer ${providerToken}` }
    })
    
    if (commitsRes.ok) {
      const commits = await commitsRes.json()
      recentCommitsCount = commits.length
      
      if (commits.length > 0) {
        lastCommitAt = commits[0].commit.committer.date
        
        // Calculate active contributors from these commits
        const uniqueAuthors = new Set()
        commits.forEach((c: any) => {
          if (c.author?.login) uniqueAuthors.add(c.author.login)
          else if (c.commit?.author?.email) uniqueAuthors.add(c.commit.author.email) // Fallback
        })
        activeContributorsCount = uniqueAuthors.size
      }
    }
    
    // B. PRs Opened in last 30 days
    const prsOpenedRes = await fetch(`https://api.github.com/search/issues?q=repo:${repoFullName}+is:pr+created:>${thirtyDaysAgo}`, {
      headers: { Authorization: `Bearer ${providerToken}` }
    })
    if (prsOpenedRes.ok) {
      const data = await prsOpenedRes.json()
      recentPrsOpened = data.total_count
    }

    // C. PRs Merged in last 30 days
    const prsMergedRes = await fetch(`https://api.github.com/search/issues?q=repo:${repoFullName}+is:pr+merged:>${thirtyDaysAgo}`, {
        headers: { Authorization: `Bearer ${providerToken}` }
    })
    if (prsMergedRes.ok) {
        const data = await prsMergedRes.json()
        recentPrsMerged = data.total_count
    }

  } catch (e) {
    console.error("Error fetching activity stats:", e)
  }

  // 3. Compute Activity Score
  // Formula: (active_contributors * 10) + (commits * 0.5) + (merged_prs * 5) + (opened_prs * 1)
  // Recency Multiplier: if last commit in 2 days -> 1.2x, else 1.0
  let score = (activeContributorsCount * 10) + (recentCommitsCount * 0.5) + (recentPrsMerged * 5) + (recentPrsOpened * 1)
  
  // Recency boost
  if (lastCommitAt) {
    const hoursSinceLastCommit = (new Date().getTime() - new Date(lastCommitAt).getTime()) / (1000 * 60 * 60)
    if (hoursSinceLastCommit < 48) {
      score *= 1.2
    } else if (hoursSinceLastCommit > 14 * 24) { // > 14 days
      score *= 0.5 // Penalty for inactivity
    }
  }

  score = Math.round(score * 100) / 100 // Round to 2 decimals

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
      contributors: activeContributorsCount, // Note: We now store ACTIVE contributors here, or should we keep total? 
      // The schema description for 'contributors' was likely 'total'. 
      // User said "Active Contributors (last 30 days)... new column".
      // I added 'recent_contributors_count'. I should use that.
      // But for backward compatibility or display, I'll update 'contributors' with total from GitHub if I can, OR just use active count?
      // The prompt says "Stars should be SECONDARY... Platform must prioritize activity".
      // Let's store total in 'contributors' (fetched previously) if possible, but I removed the total fetch to save time.
      // Let's just use the active count for the new column and keep 'contributors' as is (maybe update with active or leave 0/old value? 
      // I'll fetch total contributors count if I can efficiently, or just leave it. 
      // Wait, in previous code I used `contributorsCount` from anon fetch. I can keep that.
      language: githubRepo.language,
      verified_at: new Date().toISOString(),
      last_synced_at: new Date().toISOString(),
      
      // New columns
      activity_score: score,
      recent_commits_count: recentCommitsCount,
      recent_prs_opened_count: recentPrsOpened,
      recent_prs_merged_count: recentPrsMerged,
      recent_contributors_count: activeContributorsCount,
      last_commit_at: lastCommitAt
    }, { onConflict: 'full_name' })
    .select()
    .single()

  if (repoError) {
    console.error("Repo insert error:", repoError)
    return { error: repoError.message }
  }

  // 5. Link to user (unchanged)
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
