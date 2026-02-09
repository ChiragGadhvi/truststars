
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Star, GitFork, TrendingUp, Trophy, Medal, Award } from 'lucide-react'

export default async function Leaderboard() {
  const supabase = await createClient()

  const { data: repos } = await supabase
    .from('repositories')
    .select('*')
    .order('stars', { ascending: false })
    .limit(50)

  const getRankIcon = (index: number) => {
    if (index === 0) return <Trophy className="h-4 w-4" />
    if (index === 1) return <Medal className="h-4 w-4" />
    if (index === 2) return <Award className="h-4 w-4" />
    return null
  }

  return (
    <div className="container py-8 max-w-6xl mx-auto px-4">
      {/* Header */}
      <div className="mb-8">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-border bg-card mb-4 text-xs text-muted-foreground">
          <TrendingUp className="h-3 w-3" />
          <span>Updated daily</span>
        </div>
        <h1 className="text-2xl md:text-3xl font-bold mb-2">Leaderboard</h1>
        <p className="text-xs text-muted-foreground">
          Top verified repositories ranked by GitHub stars
        </p>
      </div>
      
      {/* Leaderboard */}
      <div className="space-y-2">
        {(!repos || repos.length === 0) ? (
          <div className="text-center py-16 border border-dashed rounded-lg bg-card">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full border border-border mb-3">
              <TrendingUp className="h-6 w-6" />
            </div>
            <h3 className="text-sm font-semibold mb-1">No repositories yet</h3>
            <p className="text-xs text-muted-foreground">
              Be the first to add a verified repository!
            </p>
          </div>
        ) : (
          repos.map((repo, index) => (
            <Link
              key={repo.id}
              href={`/repo/${repo.owner}/${repo.name}`}
              className="group block"
            >
              <div className="rounded-lg border border-border bg-card p-4 hover:bg-accent/50 transition-all">
                <div className="flex items-center gap-3">
                  {/* Rank */}
                  <div className="flex items-center justify-center w-10 h-10 rounded-lg border border-border shrink-0">
                    {getRankIcon(index) || (
                      <span className="font-bold text-xs">#{index + 1}</span>
                    )}
                  </div>

                  {/* Avatar */}
                  <Avatar className="h-10 w-10 rounded-lg border border-border shrink-0">
                    <AvatarImage src={`https://github.com/${repo.owner}.png`} />
                    <AvatarFallback className="rounded-lg text-xs">{repo.owner[0]}</AvatarFallback>
                  </Avatar>

                  {/* Repo Info */}
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-sm mb-0.5 truncate group-hover:underline">
                      {repo.full_name}
                    </div>
                    <p className="text-xs text-muted-foreground line-clamp-1">
                      {repo.description || "No description"}
                    </p>
                  </div>

                  {/* Stats */}
                  <div className="hidden md:flex items-center gap-4 shrink-0">
                    <div className="text-right">
                      <div className="flex items-center gap-1.5 text-sm font-semibold mb-0.5">
                        <Star className="h-3.5 w-3.5" />
                        {repo.stars.toLocaleString()}
                      </div>
                      <div className="text-xs text-muted-foreground">stars</div>
                    </div>
                    <div className="text-right">
                      <div className="flex items-center gap-1.5 text-sm font-semibold mb-0.5">
                        <GitFork className="h-3.5 w-3.5" />
                        {repo.forks.toLocaleString()}
                      </div>
                      <div className="text-xs text-muted-foreground">forks</div>
                    </div>
                    {repo.language && (
                      <div className="text-right min-w-[70px]">
                        <div className="inline-flex items-center gap-1.5 px-2 py-1 rounded border border-border text-xs">
                          <div className="w-1.5 h-1.5 rounded-full bg-foreground" />
                          {repo.language}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Mobile Stats */}
                  <div className="flex md:hidden flex-col items-end gap-0.5 shrink-0">
                    <div className="flex items-center gap-1 text-xs font-semibold">
                      <Star className="h-3 w-3" />
                      {repo.stars.toLocaleString()}
                    </div>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <GitFork className="h-3 w-3" />
                      {repo.forks.toLocaleString()}
                    </div>
                  </div>
                </div>
              </div>
            </Link>
          ))
        )}
      </div>
    </div>
  )
}
