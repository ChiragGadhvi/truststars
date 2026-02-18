'use client'

import { useState, useEffect, Suspense } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Search, Plus, Loader2, Github, AlertCircle, Upload, Check } from 'lucide-react'
import { listMyRepos, addRepository, checkRepo } from '@/actions/github'
import { useRouter, useSearchParams } from 'next/navigation'
import Image from 'next/image'

interface Repo {
  id: number
  name: string
  full_name: string
  description: string
  private: boolean
  html_url: string
  owner: {
    login: string
    avatar_url: string
  }
  permissions?: {
    admin: boolean
    maintain: boolean
    push: boolean
  }
  is_added?: boolean
}

export function AddRepoModal(props: { onRepoAdded?: () => void, children?: React.ReactNode }) {
  return (
    <Suspense fallback={props.children ?? (
      <Button className="font-semibold shadow-md bg-white text-black hover:bg-gray-200 transition-all duration-300">
        <Plus className="mr-2 h-4 w-4" /> Add Repository
      </Button>
    )}>
      <AddRepoModalContent {...props} />
    </Suspense>
  )
}

function AddRepoModalContent({ onRepoAdded, children }: { onRepoAdded?: () => void, children?: React.ReactNode }) {
  const [open, setOpen] = useState(false)
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [repos, setRepos] = useState<Repo[]>([])
  const [selectedRepo, setSelectedRepo] = useState<Repo | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [needsGithub, setNeedsGithub] = useState(false)
  
  // Search state
  const [searchTerm, setSearchTerm] = useState('')

  // URL state
  const [useUrl, setUseUrl] = useState(false)
  const [repoUrl, setRepoUrl] = useState('')
  const [urlLoading, setUrlLoading] = useState(false)

  // Form state for step 2
  const [customDescription, setCustomDescription] = useState('')
  const [customIconUrl, setCustomIconUrl] = useState('')
  const [previewUrl, setPreviewUrl] = useState('')

  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    // Open if triggered from redirect
    const addRepo = searchParams.get('add_repo')
    if (addRepo) {
      setOpen(true)
      // Clean up URL
      router.replace('/')
    }
  }, [searchParams])

  useEffect(() => {
    if (open) {
      checkUser()
      // Reset form
      setSelectedRepo(null)
      setCustomDescription('')
      setCustomIconUrl('')
      setPreviewUrl('')
      setSearchTerm('')
      setUseUrl(false)
      setRepoUrl('')
    }
  }, [open])

  const checkUser = async () => {
    setLoading(true)
    setError(null)
    setNeedsGithub(false)
    
    const supabase = createClient()
    const { data: { session } } = await supabase.auth.getSession()
    
    if (session?.user) {
      setUser(session.user)
      if (session.provider_token) {
        const result: any = await listMyRepos(session.provider_token)
        if (result.error) {
           // If error is related to token, might need re-auth
           if (result.error === "No provider token found" || result.error.includes("Bad credentials") || result.error.includes("401")) { 
             setNeedsGithub(true)
           } else {
             setRepos([]) 
           }
        } else {
          setRepos(result.data || [])
        }
      } else {
        setNeedsGithub(true)
      }
    } else {
      setUser(null)
    }
    setLoading(false)
  }

  const handleSelectRepo = (repo: Repo) => {
    setSelectedRepo(repo)
    setCustomDescription(repo.description || '')
    // Default to GitHub avatar, but don't set customIconUrl yet unless user uploads
    setPreviewUrl(repo.owner?.avatar_url || '')
    setCustomIconUrl('') 
    setError(null)
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0]
      if (file.size > 1024 * 1024) { // 1MB limit
         setError("Image too large (max 1MB). Please use a smaller image.")
         return
      }
      
      const reader = new FileReader()
      reader.onloadend = () => {
        const result = reader.result as string
        setCustomIconUrl(result)
        setPreviewUrl(result)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleUrlSubmit = async () => {
    if (!repoUrl) return
    setUrlLoading(true)
    setError(null)

    try {
      // Basic validation for URL
      const match = repoUrl.match(/(?:github\.com\/)?([^/]+)\/([^/]+?)(?:\.git|\/)?$/)
      if (!match) {
        setError("Invalid GitHub URL. Please use format like 'owner/repo' or 'github.com/owner/repo'")
        setUrlLoading(false)
        return
      }

      const fullName = `${match[1]}/${match[2]}`
      
      const supabase = createClient()
      const { data: { session } } = await supabase.auth.getSession()
      
      const result = await checkRepo(fullName, session?.provider_token || undefined)
      if (result.error) {
        setError(result.error)
        setUrlLoading(false)
        return
      }

      const repoData = result.data
      
      // Map to our Repo interface
      const mappedRepo: Repo = {
        id: repoData.id,
        name: repoData.name,
        full_name: repoData.full_name,
        description: repoData.description || '',
        private: repoData.private,
        html_url: repoData.html_url,
        owner: {
          login: repoData.owner.login,
          avatar_url: repoData.owner.avatar_url
        }
      }

      handleSelectRepo(mappedRepo)
    } catch (err) {
      setError("Failed to verify repository")
    }
    setUrlLoading(false)
  }

  const handleSubmit = async () => {
    if (!selectedRepo) return
    
    setSubmitting(true)
    setError(null)
    
    const supabase = createClient()
    const { data: { session } } = await supabase.auth.getSession()
    
    // provider_token is optional now
    try {
      const result: any = await addRepository(
        selectedRepo.full_name, 
        session?.provider_token || undefined,
        {
          description: customDescription,
          imageUrl: customIconUrl || selectedRepo.owner?.avatar_url // Use custom or fallback
        }
      )
      
      if (result.error) {
        setError(typeof result.error === 'string' ? result.error : 'An error occurred')
      } else {
        setOpen(false)
        router.refresh()
        if (onRepoAdded) onRepoAdded()
        setSelectedRepo(null)
      }
    } catch (err) {
      console.error(err)
      setError("Failed to add repository")
    }
    setSubmitting(false)
  }

  const filteredRepos = repos.filter(repo => 
    repo.full_name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children ? children : (
          <Button className="font-semibold shadow-md bg-white text-black hover:bg-gray-200 transition-all duration-300">
            <Plus className="mr-2 h-4 w-4" /> Add Repository
          </Button>
        )}
      </DialogTrigger>
      {/* Explicit solid background */}
      <DialogContent className="sm:max-w-[600px] max-h-[85vh] overflow-hidden flex flex-col p-0 gap-0 bg-white dark:bg-zinc-950 border border-border shadow-2xl">
        <div className="p-6 border-b border-border bg-muted/5">
          <DialogHeader>
            <DialogTitle className="text-xl">Add a Repository</DialogTitle>
          </DialogHeader>
        </div>
        
        <div className="flex-1 overflow-y-auto p-6">
          {error && (
            <div className="mb-4 p-3 bg-destructive/10 text-destructive rounded-lg text-sm flex items-center gap-2">
              <AlertCircle className="h-4 w-4" />
              {error}
            </div>
          )}


          {!selectedRepo ? (
            // Step 1: Select Repo
            <div className="space-y-4">
              <div className="flex border-b border-border/50 mb-4">
                <button 
                  onClick={() => { setUseUrl(false); setError(null); }}
                  className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 ${!useUrl ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'}`}
                >
                  Your Repositories
                </button>
                <button 
                  onClick={() => { setUseUrl(true); setError(null); }}
                  className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 ${useUrl ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'}`}
                >
                  Add by URL
                </button>
              </div>

              {!useUrl ? (
                <>
                  {!user ? (
                    <div className="text-center py-12 space-y-6">
                       <div className="space-y-2">
                         <h3 className="text-lg font-semibold">Sign in to search your repos</h3>
                         <p className="text-sm text-muted-foreground max-w-xs mx-auto">
                           Login with GitHub to quickly see and add your own repositories.
                         </p>
                       </div>
                       <div className="flex flex-col gap-3 max-w-xs mx-auto">
                          <Button 
                             variant="outline"
                             className="w-full gap-2"
                             onClick={async () => {
                               const supabase = createClient()
                               await supabase.auth.signInWithOAuth({
                                 provider: 'github',
                                 options: {
                                   redirectTo: `${location.origin}/auth/callback?next=/?add_repo=true`,
                                   scopes: 'repo read:user user:email'
                                 }
                               })
                             }}
                           >
                             <Github className="h-4 w-4" />
                             Sign in with GitHub
                           </Button>
                           <p className="text-xs text-muted-foreground">Or use the <button className="text-primary hover:underline" onClick={() => setUseUrl(true)}>Add by URL</button> tab</p>
                       </div>
                    </div>
                  ) : (
                    <>
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input 
                          placeholder="Search your repositories..." 
                          className="pl-9 bg-secondary/50 border-border"
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                        />
                      </div>

                      {loading ? (
                        <div className="flex justify-center py-8">
                          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                        </div>
                      ) : needsGithub ? (
                        <div className="text-center py-8">
                           <Github className="mx-auto h-12 w-12 text-muted-foreground mb-3 opacity-50" />
                           <p className="text-muted-foreground mb-4">We need access to your GitHub repositories.</p>
                           <Button onClick={async () => {
                             const supabase = createClient()
                             await supabase.auth.signInWithOAuth({
                               provider: 'github',
                               options: {
                                 redirectTo: `${location.origin}/auth/callback`,
                                 scopes: 'repo read:user user:email'
                               }
                             })
                           }}>
                             Connect GitHub
                           </Button>
                        </div>
                      ) : filteredRepos.length > 0 ? (
                        <div className="space-y-2">
                          {filteredRepos.map(repo => (
                            <button
                              key={repo.id}
                              onClick={() => !repo.is_added && handleSelectRepo(repo)}
                              disabled={repo.is_added}
                              className={`w-full flex items-center gap-3 p-3 rounded-xl border border-border/50 transition-colors text-left group ${
                                repo.is_added ? 'opacity-60 cursor-default bg-muted/30' : 'hover:bg-muted/50'
                              }`}
                            >
                              <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center shrink-0 overflow-hidden border border-border/20">
                                 {repo.owner.avatar_url ? (
                                   <Image src={repo.owner.avatar_url} alt={repo.owner.login} width={40} height={40} />
                                 ) : (
                                   <Github className="h-5 w-5 text-muted-foreground" />
                                 )}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="font-medium truncate group-hover:text-primary transition-colors flex items-center gap-2">
                                  {repo.name}
                                  {repo.is_added && (
                                    <span className="text-[10px] bg-green-500/10 text-green-600 px-1.5 py-0.5 rounded-full font-medium border border-green-500/20">
                                      Added
                                    </span>
                                  )}
                                </div>
                                <div className="text-xs text-muted-foreground truncate opacity-70">{repo.full_name}</div>
                              </div>
                              <div className={`transition-opacity ${repo.is_added ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
                                 {repo.is_added ? (
                                   <Check className="h-5 w-5 text-green-500" />
                                 ) : (
                                   <Plus className="h-5 w-5 text-muted-foreground" />
                                 )}
                              </div>
                            </button>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-10 text-muted-foreground">
                          No repositories found matching your search.
                        </div>
                      )}
                    </>
                  )}
                </>
              ) : (
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-muted-foreground">GitHub Repository URL</label>
                    <div className="flex gap-2">
                      <Input 
                        placeholder="https://github.com/owner/repo" 
                        value={repoUrl}
                        onChange={(e) => setRepoUrl(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleUrlSubmit()}
                        className="bg-secondary/50 border-border"
                      />
                      <Button onClick={handleUrlSubmit} disabled={urlLoading || !repoUrl} className="shrink-0">
                        {urlLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Verify"}
                      </Button>
                    </div>
                    <p className="text-[10px] text-muted-foreground ml-1">
                      Example: github.com/vercel/next.js
                    </p>
                  </div>
                </div>
              )}
            </div>
          ) : (
            // Step 2: Configure Repo
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
              <div className="flex items-center gap-4 p-4 bg-secondary/30 rounded-xl border border-border/50">
                 <div className="h-16 w-16 rounded-xl bg-muted relative overflow-hidden shrink-0 border border-border/20">
                    <Image src={previewUrl} alt="Preview" fill className="object-cover" />
                 </div>
                 <div>
                   <h3 className="font-bold text-lg">{selectedRepo.name}</h3>
                   <p className="text-xs text-muted-foreground">{selectedRepo.full_name}</p>
                 </div>
              </div>

              <div className="space-y-4">
                 <div className="grid gap-2">
                   <label className="text-sm font-medium">Custom Icon</label>
                   <div className="flex items-center gap-3">
                      <Button variant="outline" className="relative overflow-hidden w-full sm:w-auto" type="button">
                        <Upload className="mr-2 h-4 w-4" /> Upload Image
                        <input 
                          type="file" 
                          accept="image/*" 
                          className="absolute inset-0 opacity-0 cursor-pointer" 
                          onChange={handleFileChange}
                        />
                      </Button>
                      <span className="text-xs text-muted-foreground">Max 1MB</span>
                   </div>
                 </div>

                 <div className="grid gap-2">
                   <label className="text-sm font-medium">Description</label>
                   <textarea
                     className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm min-h-[100px] focus:ring-1 focus:ring-primary transition-all resize-none shadow-sm"
                     value={customDescription}
                     onChange={(e) => setCustomDescription(e.target.value)}
                     placeholder="Describe your repository..."
                     maxLength={200}
                   />
                   <div className="text-right text-[10px] text-muted-foreground">
                     {customDescription.length}/200
                   </div>
                 </div>
              </div>
            </div>
          )}
        </div>

        {selectedRepo && (
          <div className="p-4 border-t border-border bg-muted/5 flex justify-between items-center">
             <Button variant="outline" onClick={() => setSelectedRepo(null)}>
               Back
             </Button>
             <Button onClick={handleSubmit} disabled={submitting}>
               {submitting ? (
                 <>
                   <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Adding...
                 </>
               ) : (
                 <>
                   Add Repository
                 </>
               )}
             </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
