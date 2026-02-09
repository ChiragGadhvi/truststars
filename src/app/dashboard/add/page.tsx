
'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { addRepository, listMyRepos } from '@/actions/github'
import { useRouter } from 'next/navigation'
import { Loader2, Star, GitFork, AlertCircle, CheckCircle2, ArrowLeft } from 'lucide-react'
import Link from 'next/link'

interface Repo {
  id: number;
  full_name: string;
  description: string;
  stargazers_count: number;
  forks_count: number;
  language: string;
  permissions?: {
    admin: boolean;
    maintain: boolean;
  };
}

export default function AddRepository() {
  const [loading, setLoading] = useState(false)
  const [fetchingRepos, setFetchingRepos] = useState(true)
  const [repos, setRepos] = useState<Repo[]>([])
  const [error, setError] = useState<string | null>(null)
  const [addingRepoId, setAddingRepoId] = useState<number | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const router = useRouter()

  useEffect(() => {
    const fetchRepos = async () => {
      setFetchingRepos(true)
      const supabase = createClient()
      const { data: { session } } = await supabase.auth.getSession()

      if (!session || !session.provider_token) {
        setError("GitHub connection lost. Please sign out and sign in again to refresh your connection.")
        setFetchingRepos(false)
        return
      }

      try {
        const result: any = await listMyRepos(session.provider_token)
        if (result.error) {
          setError(result.error)
        } else {
          setRepos(result.data || [])
        }
      } catch (err) {
        setError("Failed to fetch repositories. Please try again.")
      }
      setFetchingRepos(false)
    }

    fetchRepos()
  }, [])

  const handleAdd = async (repo: Repo) => {
    setAddingRepoId(repo.id)
    setError(null)
    setSuccessMessage(null)
    const supabase = createClient()
    const { data: { session } } = await supabase.auth.getSession()
    
    if (!session?.provider_token) {
       setError("Session expired. Please refresh the page.")
       setAddingRepoId(null)
       return
    }

    try {
      const result: any = await addRepository(repo.full_name, session.provider_token)
      if (result.error) {
        setError(result.error)
        setAddingRepoId(null)
      } else {
        setSuccessMessage(`Successfully added ${repo.full_name}!`)
        setTimeout(() => {
          router.push('/dashboard')
          router.refresh()
        }, 1500)
      }
    } catch (err) {
      setError("Failed to add repository. Please try again.")
      setAddingRepoId(null)
    }
  }

  return (
    <div className="container py-8 max-w-4xl mx-auto px-4">
      {/* Header */}
      <div className="mb-6">
        <Link href="/dashboard" className="inline-flex items-center text-xs text-muted-foreground hover:text-foreground mb-3 transition-colors">
          <ArrowLeft className="h-3 w-3 mr-1.5" />
          Back to Dashboard
        </Link>
        <h1 className="text-2xl md:text-3xl font-bold mb-1">Add Repository</h1>
        <p className="text-xs text-muted-foreground">
          Select a repository you maintain to add to your verified profile
        </p>
      </div>

      {/* Success Message */}
      {successMessage && (
        <div className="border border-border bg-card p-3 rounded-lg mb-4 flex items-center gap-2 text-xs">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="bg-destructive/10 border border-destructive/20 text-destructive p-3 rounded-lg mb-4 flex items-start gap-2 text-xs">
          <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
          <div>
            <p className="font-medium mb-0.5">Error</p>
            <p className="opacity-90">{error}</p>
          </div>
        </div>
      )}
      
      {/* Loading State */}
      {fetchingRepos ? (
        <div className="flex flex-col items-center justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin mb-3" />
          <p className="text-xs text-muted-foreground">Fetching your repositories...</p>
        </div>
      ) : (
        <div className="space-y-2">
          {repos.length === 0 ? (
            <div className="text-center py-12 border border-dashed rounded-lg bg-card">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-full border border-border mb-3">
                <AlertCircle className="h-6 w-6" />
              </div>
              <h3 className="text-sm font-semibold mb-1">No repositories found</h3>
              <p className="text-xs text-muted-foreground max-w-md mx-auto">
                We couldn't find any repositories where you have maintainer or admin access.
              </p>
            </div>
          ) : (
            <>
              <p className="text-xs text-muted-foreground mb-3">
                Found {repos.length} {repos.length === 1 ? 'repository' : 'repositories'}
              </p>
              {repos.map((repo) => (
                <div 
                  key={repo.id} 
                  className="rounded-lg border border-border bg-card p-4 hover:bg-accent/50 transition-all"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-sm mb-1.5 truncate group-hover:underline">
                        {repo.full_name}
                      </h3>
                      <p className="text-xs text-muted-foreground line-clamp-2 mb-2">
                        {repo.description || "No description provided"}
                      </p>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Star className="h-3 w-3" />
                          <span>{repo.stargazers_count.toLocaleString()}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <GitFork className="h-3 w-3" />
                          <span>{repo.forks_count.toLocaleString()}</span>
                        </div>
                        {repo.language && (
                          <div className="flex items-center gap-1">
                            <div className="w-1.5 h-1.5 rounded-full bg-foreground" />
                            <span>{repo.language}</span>
                          </div>
                        )}
                      </div>
                    </div>
                    <Button 
                      onClick={() => handleAdd(repo)} 
                      disabled={addingRepoId !== null}
                      size="sm"
                      className="shrink-0 text-xs"
                    >
                      {addingRepoId === repo.id ? (
                        <>
                          <Loader2 className="h-3 w-3 animate-spin mr-1.5" />
                          Adding...
                        </>
                      ) : (
                        "Add"
                      )}
                    </Button>
                  </div>
                </div>
              ))}
            </>
          )}
        </div>
      )}
    </div>
  )
}
