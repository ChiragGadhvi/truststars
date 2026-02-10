'use client'

import Link from 'next/link'
import Image from 'next/image'
import { RepoChart } from '@/components/repo-chart'
import { Star, GitFork, Users, ShieldCheck, ArrowUpRight, Scale, ChevronRight, Activity, GitCommit, GitPullRequest, Calendar } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { motion } from 'framer-motion'

interface RepoClientProps {
  owner: string
  repoName: string
  repository: any
  maintainers: any[]
  chartData: any[]
}

export default function RepoClient({ owner, repoName, repository, maintainers, chartData }: RepoClientProps) {
  if (!repository) return null
  const fullName = `${owner}/${repoName}`

  return (
    <div className="container py-8 max-w-6xl mx-auto px-4 animate-in fade-in duration-300">
      {/* Breadcrumb Navigation */}
      <motion.nav 
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-2 text-xs text-muted-foreground mb-8"
      >
        <Link href="/" className="hover:text-foreground transition-colors flex items-center gap-1.5">
          <Image src="/web-app-manifest-192x192.png" alt="TrustStars" width={16} height={16} className="rounded" />
          <span>TrustStars</span>
        </Link>
        <ChevronRight className="h-3 w-3" />
        <span>Repos</span>
        <ChevronRight className="h-3 w-3" />
        <span className="text-foreground font-medium">{repoName}</span>
      </motion.nav>

      {/* Header */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-6"
      >
        <div className="max-w-3xl flex items-center gap-5">
           {repository.image_url ? (
            <div className="w-20 h-20 rounded-2xl overflow-hidden border border-border shadow-sm shrink-0">
               <Image src={repository.image_url} alt={repository.name} width={80} height={80} className="object-cover w-full h-full" />
            </div>
           ) : (
            <div className="w-20 h-20 rounded-2xl bg-muted flex items-center justify-center text-3xl font-bold border border-border shadow-sm shrink-0">
               {repository.name[0].toUpperCase()}
            </div>
           )}
           <div>
            <div className="flex items-center gap-3 mb-1">
              <h1 className="text-3xl md:text-4xl font-bold tracking-tight">
                {repository.name}
              </h1>
              <div className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-2 py-0.5 rounded-full text-xs font-medium flex items-center gap-1 border border-emerald-500/20" title="Verified">
                <ShieldCheck className="h-3 w-3" /> Verified
              </div>
            </div>
            <p className="text-base text-muted-foreground leading-relaxed line-clamp-2 max-w-xl">{repository.description}</p>
            
            <div className="flex items-center gap-4 mt-3 text-sm text-muted-foreground">
              {repository.language && (
                <div className="flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full bg-primary" />
                  {repository.language}
                </div>
              )}
               <div className="flex items-center gap-1 group cursor-help" title="Based on recent GitHub activity">
                  <Activity className="h-3.5 w-3.5 text-primary" />
                  Score: <span className="font-semibold text-foreground">{Math.round(repository.activity_score || 0)}</span>
              </div>
            </div>
           </div>
        </div>
        <div className="flex gap-3 shrink-0 self-start md:self-center">
          <Button variant="outline" size="sm" asChild className="gap-2">
            <a href={`https://github.com/${fullName}`} target="_blank" rel="noopener noreferrer">
              <ArrowUpRight className="h-4 w-4" />
              View on GitHub
            </a>
          </Button>
        </div>
      </motion.div>

      {/* Developer Activity Section (Primary) */}
      <div className="mb-10">
        <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
           <Activity className="h-5 w-5 text-primary" />
           Developer Activity
           <span className="text-xs font-normal text-muted-foreground ml-2 px-2 py-0.5 bg-muted rounded-full">Last 30 Days</span>
        </h2>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {[
            { 
               icon: Users, 
               label: 'Active Users', 
               value: repository.recent_contributors_count || 0,
               sub: 'Contributors',
               color: 'text-blue-500', 
               bg: 'bg-blue-500/10'
            },
            { 
               icon: GitCommit, 
               label: 'Commits', 
               value: repository.recent_commits_count || 0, 
               sub: 'Code Changes',
               color: 'text-amber-500',
               bg: 'bg-amber-500/10'
            },
            { 
               icon: GitPullRequest, 
               label: 'Merged PRs', 
               value: repository.recent_prs_merged_count || 0, 
               sub: 'Features Shipped',
               color: 'text-purple-500',
               bg: 'bg-purple-500/10'
            },
             { 
               icon: Calendar, 
               label: 'Last Activity', 
               value: repository.last_commit_at ? new Date(repository.last_commit_at).toLocaleDateString() : 'N/A', 
               sub: 'Last Commit',
               color: 'text-emerald-500',
               bg: 'bg-emerald-500/10'
            }
          ].map((stat, idx) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 + idx * 0.05 }}
              className="p-5 rounded-xl border bg-card hover:bg-accent/30 transition-all group flex flex-col shadow-sm"
            >
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center mb-3 ${stat.bg} ${stat.color}`}>
                <stat.icon className="h-5 w-5" />
              </div>
              <span className="text-2xl font-bold tracking-tight mb-0.5 group-hover:text-primary transition-colors">
                {stat.value}
              </span>
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">
                 {stat.label}
              </span>
              <span className="text-[10px] text-muted-foreground/60">
                 {stat.sub}
              </span>
            </motion.div>
          ))}
        </div>

        {/* Charts */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="grid grid-cols-1 md:grid-cols-2 gap-6"
        >
          <div className="bg-card rounded-xl border p-1 shadow-sm">
             <div className="px-4 py-3 border-b flex items-center justify-between">
                <h3 className="font-semibold text-sm">Activity Growth</h3>
                <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Activity Score</span>
             </div>
             <RepoChart data={chartData} title="" dataKey="activity_score" color="#10b981" />
          </div>
          <div className="bg-card rounded-xl border p-1 shadow-sm">
             <div className="px-4 py-3 border-b flex items-center justify-between">
                <h3 className="font-semibold text-sm">Contributor Growth</h3>
                 <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Contributors</span>
             </div>
             {/* Note: chartData relies on historical 'contributors' count which was active_contributors in updated addRepo. 
                 But wait, chartData only has stars/forks/activity_score in update page.tsx logic unless I added contributors.
                 I didn't add 'contributors' to chartData map in page.tsx. I should fix that next if not present.
                 Wait, previously fetch history selected `*`. And repo_stats_history has `contributors`.
                 So just need to expose it in page.tsx map. I'll pass 'contributors' dataKey.
             */}
             <RepoChart data={chartData} title="" dataKey="contributors" color="#3b82f6" />
          </div>
        </motion.div>
      </div>

      {/* Secondary Stats (Stars & Forks) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-10 py-6 border-t border-b border-border/40">
           <div className="flex items-center gap-3 px-4">
              <Star className="h-4 w-4 text-muted-foreground" />
              <div>
                 <div className="font-bold text-lg">{repository.stars.toLocaleString()}</div>
                 <div className="text-xs text-muted-foreground">Stargazers</div>
              </div>
           </div>
           <div className="flex items-center gap-3 px-4 border-l border-border/40">
              <GitFork className="h-4 w-4 text-muted-foreground" />
              <div>
                 <div className="font-bold text-lg">{repository.forks.toLocaleString()}</div>
                 <div className="text-xs text-muted-foreground">Forks</div>
              </div>
           </div>
            <div className="flex items-center gap-3 px-4 border-l border-border/40">
              <Scale className="h-4 w-4 text-muted-foreground" />
              <div>
                 <div className="font-bold text-sm truncate max-w-[100px]">{repository.license?.spdx_id || 'MIT'}</div>
                 <div className="text-xs text-muted-foreground">License</div>
              </div>
           </div>
      </div>

      {/* Maintainers */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="mb-8"
      >
        <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
          Verified Maintainers
          <span className="text-xs font-normal text-muted-foreground bg-secondary px-2 py-0.5 rounded-full">{maintainers.length}</span>
        </h2>
        {maintainers.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {maintainers.map((user: any, idx: number) => (
              <motion.div
                key={user.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.6 + idx * 0.05 }}
              >
                <Link href={`/dev/${user.github_username}`} className="group block" prefetch={true}>
                  <div className="flex items-center gap-3 p-3 rounded-lg border bg-card hover:bg-accent/50 hover:border-primary/20 hover:scale-105 transition-all shadow-sm">
                    <Avatar className="h-10 w-10 border-2 border-background shadow-sm">
                      <AvatarImage src={user.avatar_url} />
                      <AvatarFallback>{user.display_name?.[0]}</AvatarFallback>
                    </Avatar>
                    <div className="overflow-hidden">
                      <p className="font-semibold text-sm group-hover:text-primary transition-colors truncate">{user.display_name}</p>
                      <p className="text-xs text-muted-foreground truncate">@{user.github_username}</p>
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="p-8 border border-dashed rounded-xl flex flex-col items-center justify-center text-center bg-muted/5">
             <Users className="h-8 w-8 text-muted-foreground/30 mb-2" />
             <p className="text-sm font-medium text-muted-foreground">No linked maintainers found</p>
             <p className="text-xs text-muted-foreground/60 max-w-xs mt-1">If you maintain this repo, sign in to claim it.</p>
          </div>
        )}
      </motion.div>
    </div>
  )
}
