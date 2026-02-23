'use client'

import { Button } from "@/components/ui/button"
import { Search, TrendingUp, Loader2, ArrowRight, BadgeCheck } from "lucide-react"
import Link from "next/link"
import Image from 'next/image'
import Footer from '@/components/footer'
import { useEffect, useState, useCallback, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'

import { motion, AnimatePresence } from 'framer-motion'
import { AddRepoModal } from '@/components/add-repo-modal'
import { AutoSyncTrigger } from '@/components/auto-sync-trigger'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

export default function Home() {
  const [repos, setRepos] = useState<any[]>([])
  const [recentRepos, setRecentRepos] = useState<any[]>([])
  const [visibleCount, setVisibleCount] = useState(10)
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const hasLoadedRef = useRef(false)
  
  // Search state
  const [searchTerm, setSearchTerm] = useState('')
  const [searchRepos, setSearchRepos] = useState<any[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [showResults, setShowResults] = useState(false)
  
  const handleSearch = useCallback(async (query: string) => {
    setIsSearching(true)
    setShowResults(true)
    const supabase = createClient()
    
    const { data } = await supabase
      .from('repositories')
      .select('name, full_name, owner, description, image_url, stars')
      .ilike('name', `%${query}%`)
      .limit(5)
    
    setSearchRepos(data || [])
    setIsSearching(false)
  }, [])
  
  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchTerm) {
        handleSearch(searchTerm)
      } else {
        setSearchRepos([])
        setShowResults(false)
      }
    }, 400)
    return () => clearTimeout(timer)
  }, [searchTerm, handleSearch])

  const fetchLeaderboard = useCallback(async () => {
    setLoading(true)
    const supabase = createClient()
    
    // Check user
    const { data: { user } } = await supabase.auth.getUser()
    setUser(user)

    // Fetch top repos sorted by Activity Score then Newest
    const { data } = await supabase
      .from('repositories')
      .select(`
        *,
        user_repositories(
          users(github_username, avatar_url)
        )
      `)
      .order('activity_score', { ascending: false })
      .order('created_at', { ascending: false })
      .limit(50)

    const { data: recentData } = await supabase
      .from('repositories')
      .select(`
        *,
        user_repositories(
          users(github_username, avatar_url)
        )
      `)
      .order('created_at', { ascending: false })
      .limit(16)

    setRepos(data || [])
    setRecentRepos(recentData || [])
    setLoading(false)
  }, [])

  useEffect(() => {
    // Only fetch once on mount
    if (!hasLoadedRef.current) {
      hasLoadedRef.current = true
      fetchLeaderboard()
    }
  }, [fetchLeaderboard])



  return (
    <div className="min-h-screen bg-background flex flex-col">
      <AutoSyncTrigger />
      {/* Main Content */}
      <main className="flex-1 flex justify-center w-full px-4 py-8 md:py-16">
        <div className="w-full">
          {/* Hero Section */}
          <div className="text-center mb-16 animate-in fade-in slide-in-from-bottom-4 duration-500 relative z-20">
            <div className="inline-flex items-center gap-3 mb-6">
              <Image src="/web-app-manifest-192x192.png" alt="TrustStars" width={60} height={60} className="rounded-lg shadow-sm" />
              <span className="text-2xl font-bold tracking-tight">TrustStars</span>
            </div>
            
            <h1 className="text-4xl md:text-5xl font-extrabold mb-4 tracking-tight">
              Most Actively Worked-On Open Source Projects
            </h1>
            <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
              Discover where developers are actually spending their time right now.
              Ranked by real-world activity, not just stars.
            </p>

            {/* Search Bar with Dropdown & Buttons */}
            <div className="max-w-2xl mx-auto mb-6 relative">
              <div className="flex gap-3 items-center relative z-50">
                <div className="relative flex-1 group">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                  <input
                    type="text"
                    placeholder="Search for active projects..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    onFocus={() => setShowResults(!!searchTerm)}
                    className="w-full pl-10 pr-4 py-2.5 bg-card/80 backdrop-blur-sm border border-border/50 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all shadow-sm"
                  />
                  
                  {/* Search Results Dropdown */}
                  <AnimatePresence>
                    {showResults && (
                      <motion.div 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 10 }}
                        className="absolute top-full left-0 right-0 mt-2 bg-background/95 backdrop-blur-md border border-border/50 rounded-xl shadow-2xl overflow-hidden z-[60]"
                      >
                        {isSearching ? (
                          <div className="p-4 flex items-center justify-center text-muted-foreground text-sm">
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Searching...
                          </div>
                        ) : searchRepos.length > 0 ? (
                          <div className="py-2">
                             {searchRepos.map((repo) => (
                               <Link 
                                 href={`/repo/${repo.owner}/${repo.name}`} 
                                 key={repo.full_name}
                                 className="flex items-center gap-3 px-4 py-3 hover:bg-muted/50 transition-colors group"
                                 onClick={() => setShowResults(false)}
                               >
                                  {repo.image_url ? (
                                    <div className="w-8 h-8 rounded-lg bg-muted relative overflow-hidden shrink-0">
                                      <Image src={repo.image_url} alt={repo.name} fill className="object-cover" />
                                    </div>
                                  ) : (
                                    <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center text-xs font-bold shrink-0">
                                      {repo.name[0].toUpperCase()}
                                    </div>
                                  )}
                                  <div className="flex-1 min-w-0 text-left">
                                    <div className="font-semibold text-sm truncate">{repo.name}</div>
                                    <div className="text-xs text-muted-foreground truncate opacity-70">{repo.description}</div>
                                  </div>
                                  <ArrowRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-all -translate-x-2 group-hover:translate-x-0" />
                               </Link>
                             ))}
                          </div>
                        ) : searchTerm ? (
                          <div className="p-4 text-center text-sm text-muted-foreground">
                            No results found for "{searchTerm}"
                          </div>
                        ) : null}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
                <AddRepoModal onRepoAdded={fetchLeaderboard} />
              </div>
            </div>
            
            {/* Click overlay to close search */}
            {showResults && (
              <div className="fixed inset-0 z-40" onClick={() => setShowResults(false)} />
            )}
          </div>

          {/* Recently Added Section */}
          {recentRepos.length > 0 && (
            <div className="mb-12 relative z-10 w-full animate-in fade-in slide-in-from-bottom-4 duration-500 delay-100">
              <div className="flex items-center mb-4 px-1">
                <h2 className="text-lg font-semibold tracking-tight">Recently Added Projects</h2>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {recentRepos.slice(0, 4).map((project) => (
                  <ProjectCard key={project.id} project={project} />
                ))}
              </div>
            </div>
          )}

          <div className="flex items-center justify-between mb-6 px-1 relative z-10">
             <h2 className="text-lg font-semibold tracking-tight">Top Active Projects</h2>
             
             <div className="flex items-center gap-2">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm" className="h-8 gap-1 text-xs border-border/30 bg-card/50 shadow-sm">
                      Last 30 days <ChevronDown className="h-3 w-3 opacity-50" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-32">
                    <DropdownMenuItem disabled className="text-muted-foreground/50">Last 7 days (Soon)</DropdownMenuItem>
                    <DropdownMenuItem>Last 30 days</DropdownMenuItem>
                    <DropdownMenuItem disabled className="text-muted-foreground/50">Last 90 days (Soon)</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
             </div>
          </div>

          {/* Leaderboard Table */}
          <div className="bg-card/30 backdrop-blur-sm rounded-2xl overflow-hidden shadow-sm border border-border/40">
            <div className="overflow-x-auto relative">
              <table className="w-full relative">
                  <thead className="border-b border-border/10 bg-card sticky top-0 z-20 shadow-sm">
                    <tr className="text-xs text-muted-foreground uppercase tracking-wider">
                      <th className="text-center py-4 px-4 font-medium w-16 text-xs text-muted-foreground/60">#</th>
                      <th className="text-left py-4 px-4 font-medium w-auto min-w-[300px]">Repository</th>
                      <th className="text-left py-4 px-4 font-medium w-[200px] hidden md:table-cell">Developer</th>
                      <th className="text-right py-4 px-4 font-medium w-[120px] whitespace-nowrap">Commits <span className="text-xs text-muted-foreground font-normal sm:hidden lg:inline">(30d)</span></th>
                      <th className="text-right py-4 px-4 font-medium w-[100px] hidden sm:table-cell">Score</th>
                      <th className="text-right py-4 px-4 font-medium w-[100px] text-muted-foreground/60">Stars</th>
                    </tr>
                  </thead>
                  <tbody className="text-sm divide-y divide-border/5">
                    {loading ? (
                      <tr>
                        <td colSpan={6} className="py-16 text-center text-muted-foreground">
                          <div className="flex flex-col items-center gap-3">
                            <div className="h-5 w-5 rounded-full border-2 border-primary border-t-transparent animate-spin opacity-50" />
                            <span>Loading activity data...</span>
                          </div>
                        </td>
                      </tr>
                    ) : repos.length > 0 ? (
                      repos.slice(0, visibleCount).map((repo: any, idx: number) => {
                        return (
                          <tr 
                            key={repo.id} 
                            className="hover:bg-muted/40 transition-colors group"
                          >
                            <td className="py-4 px-4 font-medium text-muted-foreground text-center text-xs">
                              {(idx + 1)}
                            </td>
                            <td className="py-4 px-4">
                              <Link 
                                href={`/repo/${repo.owner}/${repo.name}`}
                                className="flex items-center gap-4 group"
                                prefetch={true}
                              >
                                {repo.image_url ? (
                                  <div className="w-10 h-10 rounded-xl bg-muted relative overflow-hidden flex-shrink-0 border border-border/10 transition-all shadow-sm">
                                    <Image src={repo.image_url} alt={repo.name} fill className="object-cover" />
                                  </div>
                                ) : (
                                  <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center text-sm font-bold flex-shrink-0 border-none group-hover:ring-2 group-hover:ring-primary/20 transition-all shadow-sm">
                                    {repo.name[0].toUpperCase()}
                                  </div>
                                )}
                                <div className="min-w-0 flex-1">
                                  <div className="font-semibold text-sm mb-0.5 group-hover:text-primary transition-colors truncate flex items-center gap-1.5">
                                    {repo.name}
                                    {repo.verified_at && (
                                      <BadgeCheck className="h-4 w-4 text-blue-500 fill-blue-500/10" />
                                    )}
                                    {(new Date(repo.created_at).getTime() > new Date().getTime() - 72 * 60 * 60 * 1000) && (
                                      <span className="bg-amber-500/10 text-amber-600 dark:text-amber-400 text-[9px] px-1.5 py-0.5 rounded-md font-bold border border-amber-500/20">NEW</span>
                                    )}
                                  </div>
                                  <div className="text-xs text-muted-foreground line-clamp-1 opacity-70 group-hover:opacity-100 transition-opacity max-w-[240px]">
                                    {repo.description || 'No description provided'}
                                  </div>
                                </div>
                              </Link>
                            </td>
                            <td className="py-4 px-4 hidden md:table-cell">
                               <div className="flex items-center gap-2">
                                  <Link href={`/dev/${repo.owner}`} className="flex items-center gap-2 hover:opacity-80 transition-opacity" prefetch={true}>
                                    <div className="relative w-6 h-6 rounded-full overflow-hidden bg-muted border border-border/20">
                                       <Image 
                                         src={repo.user_repositories?.[0]?.users?.avatar_url || repo.owner_avatar_url || `https://github.com/${repo.owner}.png`} 
                                         alt={repo.owner}
                                         fill
                                         className="object-cover"
                                       />
                                    </div>
                                    <span className="text-xs font-medium text-muted-foreground truncate max-w-[120px] hover:text-foreground transition-colors">{repo.owner_display_name || repo.owner}</span>
                                  </Link>
                               </div>
                            </td>
                            <td className="py-4 px-4 text-right">
                               <span className="font-semibold text-foreground/90">{repo.recent_commits_count || 0}</span>
                            </td>
                             <td className="py-4 px-4 text-right hidden sm:table-cell">
                               <div className="flex items-center justify-end gap-1 text-emerald-500 font-bold">
                                 <TrendingUp className="h-3 w-3" />
                                 {Math.round(repo.activity_score || 0)}
                               </div>
                            </td>
                            <td className="py-4 px-4 text-right text-muted-foreground/50 text-xs font-mono">
                              {repo.stars.toLocaleString()}
                            </td>
                          </tr>
                        )
                      })
                  ) : (
                    <tr>
                      <td colSpan={5} className="py-16 text-center text-muted-foreground">
                        <div className="flex flex-col items-center gap-2">
                           <p className="font-medium">No repositories yet</p>
                           <p className="text-xs opacity-70">Be the first to add one!</p>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            <div className="py-3 px-6 border-t border-border/10 bg-muted/5 flex items-center justify-center">
               <p className="text-[10px] text-muted-foreground/50 tracking-wide uppercase font-medium">
                 Repository details refresh automatically every 15 minutes
               </p>
            </div>
          </div>
          
          {visibleCount < repos.length && (
            <div className="mt-6 flex justify-center">
              <Button 
                variant="outline" 
                onClick={() => setVisibleCount(prev => prev + 10)}
                className="bg-card/50 hover:bg-card/80 border-border/40 shadow-sm"
              >
                Show 10 more
              </Button>
            </div>
          )}

        </div>
      </main>
    </div>
  )
}

function ProjectCard({ project }: { project: any }) {
  if (!project) return null;

  return (
    <div className="relative w-full h-[150px] bg-card/80 backdrop-blur-sm border border-border/40 rounded-xl p-4 flex flex-col justify-between shadow-sm hover:border-border/80 transition-colors cursor-pointer">
      <Link href={`/repo/${project.owner}/${project.name}`} className="absolute inset-0 z-10" />
      
      <div className="flex items-start gap-4">
        {project.image_url ? (
          <div className="w-12 h-12 rounded-xl bg-muted relative overflow-hidden flex-shrink-0 border border-border/10">
            <Image src={project.image_url} alt={project.name} fill className="object-cover" />
          </div>
        ) : (
          <div className="w-12 h-12 rounded-xl bg-muted flex items-center justify-center text-lg font-bold flex-shrink-0 border border-border/10">
            {project.name[0].toUpperCase()}
          </div>
        )}
        <div className="flex-1 min-w-0 pr-2 pt-0.5">
          <h3 className="text-base font-semibold text-foreground truncate">{project.name}</h3>
          <p className="text-xs text-muted-foreground line-clamp-1 opacity-80 mt-0.5">{project.description || 'No description'}</p>
        </div>
        <div className="flex-shrink-0 pt-0.5">
           <span className="text-[9px] font-bold px-2 py-1 bg-amber-500/10 text-amber-500/90 rounded-md uppercase border border-amber-500/20 whitespace-nowrap">
             NEW
           </span>
        </div>
      </div>

      <div className="flex items-end justify-between mt-4 px-1">
        <div className="flex flex-col gap-0.5">
          <span className="text-[9px] text-muted-foreground font-semibold uppercase tracking-wider">Stars</span>
          <span className="font-bold text-sm text-foreground/90">{project.stars?.toLocaleString() || 0}</span>
        </div>
        <div className="flex flex-col gap-0.5">
          <span className="text-[9px] text-muted-foreground font-semibold uppercase tracking-wider">Commits</span>
          <span className="font-bold text-sm text-foreground/90">{project.recent_commits_count || 0}</span>
        </div>
      </div>
    </div>
  );
}

function FlippingProjectCard({ projects, interval = 5000, delay = 0 }: { projects: any[], interval?: number, delay?: number }) {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (!projects || projects.length <= 1) return;
    
    const timeout = setTimeout(() => {
      const intervalId = setInterval(() => {
        setCurrentIndex((prev) => (prev + 1) % projects.length);
      }, interval);
      return () => clearInterval(intervalId);
    }, delay);

    return () => clearTimeout(timeout);
  }, [projects, interval, delay]);

  if (!projects || projects.length === 0) return null;

  const project = projects[currentIndex];

  return (
    <div className="relative w-full h-[150px] perspective-[1000px]">
      <AnimatePresence mode="wait">
        <motion.div
          key={project.id || project.name}
          initial={{ rotateY: 90, opacity: 0 }}
          animate={{ rotateY: 0, opacity: 1 }}
          exit={{ rotateY: -90, opacity: 0 }}
          transition={{ duration: 0.5, ease: "easeInOut" }}
          className="absolute inset-0 bg-card/80 backdrop-blur-sm border border-border/40 rounded-xl p-4 flex flex-col justify-between shadow-sm hover:border-border/80 transition-colors cursor-pointer"
        >
          <Link href={`/repo/${project.owner}/${project.name}`} className="absolute inset-0 z-10" />
          
          <div className="flex items-start gap-4">
            {project.image_url ? (
              <div className="w-12 h-12 rounded-xl bg-muted relative overflow-hidden flex-shrink-0 border border-border/10">
                <Image src={project.image_url} alt={project.name} fill className="object-cover" />
              </div>
            ) : (
              <div className="w-12 h-12 rounded-xl bg-muted flex items-center justify-center text-lg font-bold flex-shrink-0 border border-border/10">
                {project.name[0].toUpperCase()}
              </div>
            )}
            <div className="flex-1 min-w-0 pr-2 pt-0.5">
              <h3 className="text-base font-semibold text-foreground truncate">{project.name}</h3>
              <p className="text-xs text-muted-foreground line-clamp-1 opacity-80 mt-0.5">{project.description || 'No description'}</p>
            </div>
            <div className="flex-shrink-0 pt-0.5">
               <span className="text-[9px] font-bold px-2 py-1 bg-amber-500/10 text-amber-500/90 rounded-md uppercase border border-amber-500/20 whitespace-nowrap">
                 NEW
               </span>
            </div>
          </div>

          <div className="flex items-end justify-between mt-4 px-1">
            <div className="flex flex-col gap-0.5">
              <span className="text-[9px] text-muted-foreground font-semibold uppercase tracking-wider">Stars</span>
              <span className="font-bold text-sm text-foreground/90">{project.stars?.toLocaleString() || 0}</span>
            </div>
            <div className="flex flex-col gap-0.5">
              <span className="text-[9px] text-muted-foreground font-semibold uppercase tracking-wider">Commits</span>
              <span className="font-bold text-sm text-foreground/90">{project.recent_commits_count || 0}</span>
            </div>
            <div className="flex flex-col gap-0.5">
              <span className="text-[9px] text-muted-foreground font-semibold uppercase tracking-wider">Contributors</span>
              <span className="font-bold text-sm text-foreground/90">{project.recent_contributors_count || 0}</span>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

function ChevronDown({ className }: { className?: string }) {
  return (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      width="24" 
      height="24" 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      className={className}
    >
      <path d="m6 9 6 6 6-6"/>
    </svg>
  )
}
