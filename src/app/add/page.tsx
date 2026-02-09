
'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { addRepository, listMyRepos } from '@/actions/github'
import { useRouter } from 'next/navigation'
import { Loader2, X, Github, Upload } from 'lucide-react'
import { signInWithGithub, signInWithGoogle } from '@/actions/auth'
import Image from 'next/image'

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

export default function AddRepoPage() {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [repos, setRepos] = useState<Repo[]>([])
  const [selectedRepo, setSelectedRepo] = useState<Repo | null>(null)
  const [repoImage, setRepoImage] = useState<string>('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const router = useRouter()

  useEffect(() => {
    const checkUser = async () => {
      const supabase = createClient()
      const { data: { session } } = await supabase.auth.getSession()
      
      if (session?.user) {
        setUser(session.user)
        fetchRepos(session.provider_token!)
      } else {
        setLoading(false)
      }
    }
    checkUser()
  }, [])

  const fetchRepos = async (token: string) => {
    setLoading(true)
    try {
      const result: any = await listMyRepos(token)
      if (result.error) {
        setError(result.error)
      } else {
        setRepos(result.data || [])
      }
    } catch (err) {
      setError("Failed to fetch repositories")
    }
    setLoading(false)
  }

  const handleSubmit = async () => {
    if (!selectedRepo) return
    
    setSubmitting(true)
    setError(null)
    
    const supabase = createClient()
    const { data: { session } } = await supabase.auth.getSession()
    
    if (!session?.provider_token) {
      setError("Session expired")
      setSubmitting(false)
      return
    }

    try {
      const result: any = await addRepository(selectedRepo.full_name, session.provider_token)
      if (result.error) {
        setError(result.error)
      } else {
        router.push('/')
        router.refresh()
      }
    } catch (err) {
      setError("Failed to add repository")
    }
    setSubmitting(false)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background/95 backdrop-blur flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background/95 backdrop-blur flex items-center justify-center p-4">
      <div className="w-full max-w-2xl bg-card border border-border rounded-lg p-6 relative">
        {/* Close Button */}
        <button
          onClick={() => router.push('/')}
          className="absolute top-4 right-4 p-1 hover:bg-accent rounded"
        >
          <X className="h-5 w-5" />
        </button>

        <h2 className="text-2xl font-bold mb-2">Add your repository</h2>
        <p className="text-xs text-muted-foreground mb-6">
          Showcase your verified GitHub repository to <strong>120,000+ monthly visitors</strong> and get a <strong>53+ DR dofollow backlink</strong>
        </p>

        {!user ? (
          <div className="text-center py-12">
            <Github className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">Connect with GitHub or Google</h3>
            <p className="text-xs text-muted-foreground mb-6">
              Sign in to add your repositories
            </p>
            <div className="flex gap-3 justify-center">
              <form action={signInWithGithub}>
                <Button type="submit" variant="outline" className="text-sm">
                  <Github className="mr-2 h-4 w-4" />
                  GitHub
                </Button>
              </form>
              <form action={signInWithGoogle}>
                <Button type="submit" className="text-sm">
                  <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
                    <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                  Google
                </Button>
              </form>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Repository Selection */}
            <div>
              <label className="block text-xs font-medium mb-2">1. Select Repository</label>
              <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto p-2 border border-border rounded-lg bg-background">
                {repos.map((repo) => (
                  <button
                    key={repo.id}
                    onClick={() => setSelectedRepo(repo)}
                    className={`p-3 rounded border text-left text-xs transition-all ${
                      selectedRepo?.id === repo.id
                        ? 'border-foreground bg-accent'
                        : 'border-border hover:border-muted-foreground'
                    }`}
                  >
                    <div className="font-semibold truncate">{repo.full_name.split('/')[1]}</div>
                    <div className="text-muted-foreground truncate">{repo.description || 'No description'}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Repository Image Upload */}
            <div>
              <label className="block text-xs font-medium mb-2">2. Repository Image (optional)</label>
              <div className="border-2 border-dashed border-border rounded-lg p-6 text-center hover:border-muted-foreground transition-colors cursor-pointer">
                <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                <p className="text-xs text-muted-foreground mb-1">Click to upload or drag and drop</p>
                <p className="text-xs text-muted-foreground">PNG, JPG up to 2MB</p>
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0]
                    if (file) {
                      const reader = new FileReader()
                      reader.onloadend = () => {
                        setRepoImage(reader.result as string)
                      }
                      reader.readAsDataURL(file)
                    }
                  }}
                />
              </div>
              {repoImage && (
                <div className="mt-2 relative w-32 h-32">
                  <Image src={repoImage} alt="Preview" fill className="object-cover rounded" />
                </div>
              )}
            </div>

            {/* Error Message */}
            {error && (
              <div className="bg-destructive/10 border border-destructive/20 text-destructive p-3 rounded text-xs">
                {error}
              </div>
            )}

            {/* Submit Button */}
            <Button
              onClick={handleSubmit}
              disabled={!selectedRepo || submitting}
              className="w-full text-sm"
            >
              {submitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Adding repository...
                </>
              ) : (
                'Add repository'
              )}
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
