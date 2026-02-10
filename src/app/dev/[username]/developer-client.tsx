'use client'

import Image from 'next/image'
import { Star, GitFork, Users, Share2, ChevronRight, Globe, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { useState } from 'react'
import { motion } from 'framer-motion'

interface DeveloperClientProps {
  username: string
  user: any
  repos: any[]
  totalStars: number
  totalForks: number
}

export default function DeveloperClient({ username, user, repos, totalStars, totalForks }: DeveloperClientProps) {
  const [copied, setCopied] = useState(false)

  const shareUrl = `${typeof window !== 'undefined' ? window.location.origin : ''}/dev/${username}`

  const handleShare = () => {
    navigator.clipboard.writeText(shareUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (!user) return null

  return (
    <div className="min-h-screen bg-background animate-in fade-in duration-300">
      <div className="container mx-auto px-4 py-6 md:py-8 max-w-5xl">
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
          <span>Developer</span>
          <ChevronRight className="h-3 w-3" />
          <span className="text-foreground font-medium">{user.github_username}</span>
        </motion.nav>

        {/* Header */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 mb-12"
        >
          <div className="flex items-center gap-4">
            <div className="w-20 h-20 rounded-full bg-muted relative overflow-hidden ring-2 ring-border">
              {user.avatar_url && (
                <Image 
                  src={user.avatar_url} 
                  alt={user.github_username} 
                  fill 
                  className="object-cover" 
                />
              )}
            </div>
            <div>
              <h1 className="text-3xl font-bold mb-1">@{user.github_username}</h1>
              {user.display_name && (
                <p className="text-muted-foreground text-sm">{user.display_name}</p>
              )}
              {user.bio && (
                <p className="text-sm mt-2 max-w-md">{user.bio}</p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {(user.twitter_handle || user.twitter_username) && (
              <Link href={`https://x.com/${(user.twitter_handle || user.twitter_username).replace('@', '')}`} target="_blank">
                <Button variant="outline" size="sm" className="text-xs transition-all hover:scale-105 bg-background shadow-sm hover:shadow-md border-border/50">
                  <svg className="mr-2 h-3 w-3" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                  </svg>
                  X
                </Button>
              </Link>
            )}
            
            {user.linkedin_url && (
               <Link href={user.linkedin_url} target="_blank">
                <Button variant="outline" size="sm" className="text-xs transition-all hover:scale-105 bg-background shadow-sm hover:shadow-md border-border/50">
                  <svg className="mr-2 h-3.5 w-3.5" viewBox="0 0 24 24" fill="currentColor"><path d="M20.5 2h-17A1.5 1.5 0 002 3.5v17A1.5 1.5 0 003.5 22h17a1.5 1.5 0 001.5-1.5v-17A1.5 1.5 0 0020.5 2zM8 19H5v-9h3zM6.5 8.25A1.75 1.75 0 118.3 6.5a1.78 1.78 0 01-1.8 1.75zM19 19h-3v-4.74c0-1.21-.43-1.56-1.1-1.56-.91 0-1.96.77-1.96 2v4.3h-3v-9h3v1.2c.5-.76 1.38-1.46 3-1.46C18.66 9.75 19 11.23 19 14z"/></svg>
                  LinkedIn
                </Button>
              </Link>
            )}

            {user.website_url && (
               <Link href={user.website_url} target="_blank">
                <Button variant="outline" size="sm" className="text-xs transition-all hover:scale-105 bg-background shadow-sm hover:shadow-md border-border/50">
                  <Globe className="mr-2 h-3.5 w-3.5" />
                  Website
                </Button>
              </Link>
            )}

            <Button 
              variant="outline" 
              size="sm" 
              className="text-xs transition-all hover:scale-105 bg-background shadow-sm hover:shadow-md border-border/50 min-w-[80px]"
              onClick={handleShare}
            >
              {copied ? (
                <>
                  <Check className="mr-2 h-3 w-3" />
                  Copied
                </>
              ) : (
                <>
                  <Share2 className="mr-2 h-3 w-3" />
                  Share
                </>
              )}
            </Button>
          </div>
        </motion.div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-12">
          {[
            { icon: Star, label: 'Total Stars', value: totalStars, subtitle: 'Across all repositories' },
            { icon: GitFork, label: 'Total Forks', value: totalForks, subtitle: 'Across all repositories' },
            { icon: Users, label: 'Repositories', value: repos.length, subtitle: 'Active repositories' }
          ].map((stat, idx) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 + idx * 0.1 }}
              className="bg-card/50 backdrop-blur-sm border border-border rounded-lg p-6 hover:bg-card/70 transition-all"
            >
              <div className="flex items-center gap-2 text-muted-foreground text-xs mb-2">
                <stat.icon className="h-4 w-4" />
                {stat.label}
              </div>
              <div className="text-3xl font-bold">{stat.value.toLocaleString()}</div>
              <div className="text-xs text-muted-foreground mt-1">{stat.subtitle}</div>
            </motion.div>
          ))}
        </div>

        {/* Repositories Section */}
        <div>
          <h2 className="text-xl font-bold mb-6">Repositories by @{user.github_username}</h2>
          
          {repos.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {repos.map((repo: any, idx: number) => (
                <motion.div
                  key={repo.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 + idx * 0.05 }}
                >
                  <Link 
                    href={`/repo/${repo.full_name.split('/')[0]}/${repo.full_name.split('/')[1]}`}
                    className="block bg-card/50 backdrop-blur-sm border border-border rounded-lg p-6 hover:bg-accent/50 hover:scale-[1.02] transition-all"
                    prefetch={true}
                  >
                    <div className="flex items-start gap-3">
                      {repo.image_url ? (
                        <div className="w-12 h-12 rounded bg-muted relative overflow-hidden flex-shrink-0">
                          <Image src={repo.image_url} alt={repo.name} fill className="object-cover" />
                        </div>
                      ) : (
                        <div className="w-12 h-12 rounded bg-muted flex items-center justify-center text-lg font-bold flex-shrink-0">
                          {repo.name[0].toUpperCase()}
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-sm mb-1 truncate">{repo.name}</h3>
                        <p className="text-xs text-muted-foreground line-clamp-2 mb-3">
                          {repo.description || 'No description'}
                        </p>
                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          {repo.language && (
                            <span>{repo.language}</span>
                          )}
                          <span className="flex items-center gap-1">
                            <Star className="h-3 w-3" />
                            {repo.stars.toLocaleString()}
                          </span>
                          <span className="flex items-center gap-1">
                            <GitFork className="h-3 w-3" />
                            {repo.forks.toLocaleString()}
                          </span>
                        </div>
                      </div>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              No repositories yet
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
