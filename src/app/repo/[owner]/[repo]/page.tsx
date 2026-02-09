
'use client'

import { createClient } from '@/lib/supabase/client'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { RepoChart } from '@/components/repo-chart'
import { Star, GitFork, Users, ShieldCheck, ArrowUpRight, Scale, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'

type Props = {
  params: Promise<{ owner: string, repo: string }>
}

export default function RepoProfile({ params }: Props) {
  const [owner, setOwner] = useState('')
  const [repoName, setRepoName] = useState('')
  const [repository, setRepository] = useState<any>(null)
  const [maintainers, setMaintainers] = useState<any[]>([])
  const [chartData, setChartData] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      const resolvedParams = await params
      setOwner(resolvedParams.owner)
      setRepoName(resolvedParams.repo)
      
      const fullName = `${resolvedParams.owner}/${resolvedParams.repo}`
      const supabase = createClient()
      
      // Fetch repo with maintainers
      const { data: repo, error } = await supabase
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

      if (error || !repo) {
        notFound()
        return
      }

      setRepository(repo)
      
      // Format maintainers safely
      const maintainersList = repo.user_repositories?.map((ur: any) => ({
        ...ur.users,
        role: ur.role
      })).filter((u: any) => u.id) || []
      setMaintainers(maintainersList)

      // Fetch history for charts
      const { data: history } = await supabase
        .from('repo_stats_history')
        .select('*')
        .eq('repo_id', repo.id)
        .order('recorded_at', { ascending: true })

      // Transform for charts
      let data = history?.map((h: any) => ({
        recorded_at: h.recorded_at,
        stars: h.stars,
        forks: h.forks
      })) || []

      // If no history, use current stats as a single point
      if (data.length === 0) {
        data.push({
          recorded_at: new Date().toISOString(),
          stars: repo.stars,
          forks: repo.forks
        })
      }

      setChartData(data)
      setLoading(false)
    }

    fetchData()
  }, [params])

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    )
  }

  if (!repository) {
    return null
  }

  const fullName = `${owner}/${repoName}`

  return (
    <div className="container py-8 max-w-6xl mx-auto px-4">
      {/* Breadcrumb Navigation */}
      <motion.nav 
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-2 text-xs text-muted-foreground mb-8"
      >
        <Link href="/" className="hover:text-foreground transition-colors flex items-center gap-1.5">
          <Image src="/truststars.png" alt="TrustStars" width={16} height={16} className="rounded" />
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
        className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4"
      >
        <div className="max-w-3xl flex items-center gap-4">
           {repository.image_url ? (
            <div className="w-16 h-16 rounded-xl overflow-hidden border border-border shadow-sm shrink-0">
               <Image src={repository.image_url} alt={repository.name} width={64} height={64} className="object-cover w-full h-full" />
            </div>
           ) : (
            <div className="w-16 h-16 rounded-xl bg-muted flex items-center justify-center text-2xl font-bold border border-border shadow-sm shrink-0">
               {repository.name[0].toUpperCase()}
            </div>
           )}
           <div>
            <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-2 tracking-tight">
              {repository.name}
              <div className="bg-green-500/10 text-green-600 dark:text-green-400 p-1 rounded-full" title="Verified">
                <ShieldCheck className="h-5 w-5" />
              </div>
            </h1>
            <p className="text-muted-foreground mt-1 text-sm leading-relaxed line-clamp-2">{repository.description}</p>
           </div>
        </div>
        <div className="flex gap-2 shrink-0">
          <Button variant="outline" size="sm" asChild className="text-xs transition-all hover:scale-105">
            <a href={`https://github.com/${fullName}`} target="_blank" rel="noopener noreferrer">
              <ArrowUpRight className="mr-1.5 h-3.5 w-3.5" />
              GitHub
            </a>
          </Button>
        </div>
      </motion.div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        {[
          { icon: Star, label: 'Stars', value: repository.stars, color: 'yellow' },
          { icon: GitFork, label: 'Forks', value: repository.forks, color: 'blue' },
          { icon: Users, label: 'Contributors', value: repository.contributors > 0 ? repository.contributors : '-', color: 'primary' },
          { icon: Scale, label: 'Language', value: repository.language || 'N/A', color: 'default' }
        ].map((stat, idx) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 + idx * 0.05 }}
            className="p-4 rounded-lg border bg-card/50 backdrop-blur-sm shadow-sm hover:shadow-md transition-all flex flex-col justify-center items-center group"
          >
            <span className={`text-xs text-muted-foreground flex items-center gap-1 mb-1 transition-colors ${
              stat.color === 'yellow' ? 'group-hover:text-yellow-500' :
              stat.color === 'blue' ? 'group-hover:text-blue-500' :
              stat.color === 'primary' ? 'group-hover:text-primary' : ''
            }`}>
              <stat.icon className="h-3 w-3" /> {stat.label}
            </span>
            <span className="text-xl font-bold tracking-tight">
              {typeof stat.value === 'number' ? stat.value.toLocaleString() : stat.value}
            </span>
          </motion.div>
        ))}
      </div>

      {/* Charts */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8"
      >
        <RepoChart data={chartData} title="Star Growth" dataKey="stars" color="#fbbf24" />
        <RepoChart data={chartData} title="Forks Growth" dataKey="forks" color="#3b82f6" />
      </motion.div>

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
                <Link href={`/dev/${user.github_username}`} className="group block">
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
          <div className="text-muted-foreground text-sm italic">No linked maintainers found.</div>
        )}
      </motion.div>
    </div>
  )
}
