'use client'

import { Button } from "@/components/ui/button"
import { Search, TrendingUp, Loader2, ArrowRight } from "lucide-react"
import Link from "next/link"
import Image from 'next/image'
import Footer from '@/components/footer'
import { useEffect, useState, useCallback, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { signInWithGoogle } from '@/actions/auth'
import { motion, AnimatePresence } from 'framer-motion'
import { AddRepoModal } from '@/components/add-repo-modal'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

export default function Home() {
  const [repos, setRepos] = useState<any[]>([])
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  
  // Search state
  const [searchTerm, setSearchTerm] = useState('')
  const [searchRepos, setSearchRepos] = useState<any[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [showResults, setShowResults] = useState(false)
  
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
  }, [searchTerm])

  useEffect(() => {
    fetchLeaderboard()
  }, [])

  const fetchLeaderboard = async () => {
    setLoading(true)
    const supabase = createClient()
    
    // Check user
    const { data: { user } } = await supabase.auth.getUser()
    setUser(user)

    // Fetch top 10 repos
    const { data } = await supabase
      .from('repositories')
      .select(`
        *,
        user_repositories!inner(
          users(github_username, avatar_url)
        )
      `)
      .order('stars', { ascending: false })
      .limit(10)

    setRepos(data || [])
    setLoading(false)
  }

  const handleSearch = async (query: string) => {
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
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Main Content */}
      <main className="flex-1">
        <div className="container mx-auto px-4 py-8 md:py-16 max-w-5xl">
          {/* Hero Section */}
          <div className="text-center mb-16 animate-in fade-in slide-in-from-bottom-4 duration-500 relative z-20">
            <div className="inline-flex items-center gap-3 mb-6">
              <Image src="/web-app-manifest-192x192.png" alt="TrustStars" width={60} height={60} className="rounded-lg shadow-sm" />
              <span className="text-2xl font-bold tracking-tight">TrustStars</span>
            </div>
            
            <h1 className="text-4xl md:text-5xl font-extrabold mb-8 tracking-tight">
              The database of verified GitHub repositories
            </h1>

            {/* Search Bar with Dropdown & Buttons */}
            <div className="max-w-2xl mx-auto mb-6 relative">
              <div className="flex gap-3 items-center relative z-50">
                <div className="relative flex-1 group">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                  <input
                    type="text"
                    placeholder="Search repositories..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    onFocus={() => setShowResults(!!searchTerm)}
                    // OnBlur logic can be tricky with click handling, usually handled by clicking outside
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

            {/* Sign In Button (only if not logged in) */}
            {!loading && !user && (
              <form action={signInWithGoogle} className="animate-in fade-in zoom-in duration-300 relative z-10">
                <Button type="submit" size="sm" className="text-xs bg-white text-black hover:bg-gray-200 transition-all shadow-sm font-semibold h-9 px-4">
                  <svg className="mr-2 h-3.5 w-3.5" viewBox="0 0 24 24">
                    <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                  Sign in with Google
                </Button>
              </form>
            )}
            
            {/* Click overlay to close search */}
            {showResults && (
              <div className="fixed inset-0 z-40" onClick={() => setShowResults(false)} />
            )}
          </div>

          <div className="flex items-center justify-between mb-6 px-1 relative z-10">
             <h2 className="text-lg font-semibold tracking-tight">Leaderboard</h2>
             
             <div className="flex items-center gap-2">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm" className="h-8 gap-1 text-xs border-border/30 bg-card/50 shadow-sm">
                      All time <ChevronDown className="h-3 w-3 opacity-50" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-32">
                    <DropdownMenuItem>All time</DropdownMenuItem>
                    <DropdownMenuItem>This month</DropdownMenuItem>
                    <DropdownMenuItem>This week</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
             </div>
          </div>

          {/* Leaderboard Table without prominent border */}
          <div className="bg-card/30 backdrop-blur-sm rounded-2xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="border-b border-border/5 bg-muted/20">
                  <tr className="text-xs text-muted-foreground uppercase tracking-wider">
                    <th className="text-left py-4 px-4 font-medium w-14">#</th>
                    <th className="text-left py-4 px-4 font-medium w-[280px] lg:w-[350px]">Repository</th>
                    <th className="text-left py-4 px-4 font-medium w-[180px] hidden md:table-cell">Developer</th>
                    <th className="w-auto"></th>
                    <th className="text-right py-4 px-4 font-medium w-28">Stars</th>
                    <th className="text-right py-4 px-6 font-medium w-28 hidden sm:table-cell">Forks</th>
                  </tr>
                </thead>
                <tbody className="text-xs divide-y divide-border/5">
                  {loading ? (
                    <tr>
                      <td colSpan={6} className="py-16 text-center text-muted-foreground">
                        <div className="flex flex-col items-center gap-3">
                          <div className="h-5 w-5 rounded-full border-2 border-primary border-t-transparent animate-spin opacity-50" />
                          <span>Loading repositories...</span>
                        </div>
                      </td>
                    </tr>
                  ) : repos.length > 0 ? (
                    repos.map((repo: any, idx: number) => {
                      const developer = repo.user_repositories?.[0]?.users
                      return (
                        <tr 
                          key={repo.id} 
                          className="hover:bg-muted/40 transition-colors"
                        >
                          <td className="py-5 px-4 font-medium text-muted-foreground">
                            {(idx + 1).toString().padStart(2, '0')}
                          </td>
                          <td className="py-5 px-4">
                            <Link 
                              href={`/repo/${repo.owner}/${repo.name}`}
                              className="flex items-center gap-4 group max-w-md"
                            >
                              {repo.image_url ? (
                                <div className="w-10 h-10 rounded-xl bg-muted relative overflow-hidden flex-shrink-0 border-none  transition-all shadow-sm">
                                  <Image src={repo.image_url} alt={repo.name} fill className="object-cover" />
                                </div>
                              ) : (
                                <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center text-sm font-bold flex-shrink-0 border-none group-hover:ring-2 group-hover:ring-primary/20 transition-all shadow-sm">
                                  {repo.name[0].toUpperCase()}
                                </div>
                              )}
                              <div className="min-w-0 flex-1">
                                <div className="font-semibold text-sm mb-1 group-hover:text-primary transition-colors truncate">
                                  {repo.name}
                                </div>
                                <div className="text-xs text-muted-foreground line-clamp-1 opacity-70 group-hover:opacity-100 transition-opacity max-w-[200px] sm:max-w-xs">
                                  {repo.description || 'No description provided'}
                                </div>
                              </div>
                            </Link>
                          </td>
                          <td className="py-5 px-4 hidden md:table-cell">
                            {developer ? (
                              <Link 
                                href={`/dev/${developer.github_username}`} 
                                className="flex items-center gap-2.5 hover:opacity-80 transition-opacity max-w-[150px] group"
                              >
                                <div className="w-9 h-9 rounded-full bg-muted relative overflow-hidden flex-shrink-0  group-hover:ring-primary/30 transition-all">
                                  {developer.avatar_url && (
                                    <Image src={developer.avatar_url} alt={developer.github_username} fill className="object-cover" />
                                  )}
                                </div>
                                <span className="truncate font-medium">{developer.github_username}</span>
                              </Link>
                            ) : (
                              <span className="text-muted-foreground opacity-50">—</span>
                            )}
                          </td>
                          <td className="w-auto"></td>
                          <td className="py-5 px-4 text-right font-medium font-mono text-muted-foreground/80">
                            {repo.stars.toLocaleString()}
                          </td>
                          <td className="py-5 px-6 text-right hidden sm:table-cell">
                            <span className="text-emerald-500/90 inline-flex items-center gap-1.5 bg-emerald-500/10 px-2 py-1 rounded-md text-[10px] font-medium border border-emerald-500/10">
                              <TrendingUp className="h-3 w-3" />
                              {repo.forks.toLocaleString()}
                            </span>
                          </td>
                        </tr>
                      )
                    })
                  ) : (
                    <tr>
                      <td colSpan={6} className="py-16 text-center text-muted-foreground">
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
          </div>


        </div>
      </main>
    </div>
  )
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
