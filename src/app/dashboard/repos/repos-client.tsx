'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Plus, Upload, Trash2, ChevronLeft, ExternalLink, Save, AlertCircle } from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'
import { deleteRepository } from '@/actions/github'
import { useRouter } from 'next/navigation'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { AddRepoModal } from '@/components/add-repo-modal'

export default function ReposClient({ initialRepos, user }: { initialRepos: any[], user: any }) {
  const [repos, setRepos] = useState<any[]>(initialRepos)
  const [selectedRepo, setSelectedRepo] = useState<any>(null)
  const [isMobileView, setIsMobileView] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle')
  const router = useRouter()

  useEffect(() => {
    // Sync props to state if they change (e.g. after server refresh)
    setRepos(initialRepos)
  }, [initialRepos])

  useEffect(() => {
    const handleResize = () => setIsMobileView(window.innerWidth < 768)
    handleResize()
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  // Auto-select first repo on desktop if none selected
  useEffect(() => {
    if (repos.length > 0 && !isMobileView && !selectedRepo) {
      setSelectedRepo(repos[0].repositories)
    }
  }, [repos, isMobileView, selectedRepo])

  const handleImageUpload = async (file: File) => {
    if (!selectedRepo) return
    setSaveStatus('saving')
    
    const reader = new FileReader()
    reader.onloadend = async () => {
      const newUrl = reader.result as string;
      
      const supabase = createClient()
      const { error } = await supabase
        .from('repositories')
        .update({ image_url: newUrl })
        .eq('id', selectedRepo.id)
      
      if (error) {
        setSaveStatus('error')
        return
      }

      const updatedRepo = {...selectedRepo, image_url: newUrl}
      setSelectedRepo(updatedRepo)
      // Update local list optimistic
      setRepos(repos.map(r => r.repositories.id === selectedRepo.id ? {...r, repositories: updatedRepo} : r))
      setSaveStatus('saved')
      setTimeout(() => setSaveStatus('idle'), 2000)
      router.refresh() // Sync server
    }
    reader.readAsDataURL(file)
  }

  // Handle local state change
  const handleChange = (field: string, value: string) => {
    if (!selectedRepo) return
    setSelectedRepo({...selectedRepo, [field]: value})
    setSaveStatus('idle')
  }

  // Handle save on blur
  const handleSave = async (field: string, value: string) => {
     if (!selectedRepo) return
     setSaveStatus('saving')
     
     const supabase = createClient()
     const { error } = await supabase
       .from('repositories')
       .update({ [field]: value })
       .eq('id', selectedRepo.id)
     
     if (error) {
       setSaveStatus('error')
     } else {
       setSaveStatus('saved')
       // Update list view too
       setRepos(repos.map(r => r.repositories.id === selectedRepo.id ? {...r, repositories: {...r.repositories, [field]: value}} : r))
       setTimeout(() => setSaveStatus('idle'), 2000)
       router.refresh()
     }
  }

  const handleDelete = async () => {
    if (!selectedRepo) return
    setIsDeleting(true)
    
    // Optimistic delete
    const prevRepos = [...repos]
    const filtered = repos.filter(r => r.repositories.id !== selectedRepo.id)
    setRepos(filtered) 
    
    if (filtered.length > 0 && !isMobileView) setSelectedRepo(filtered[0].repositories)
    else setSelectedRepo(null)
    setShowDeleteConfirm(false)
    
    try {
      const result: any = await deleteRepository(selectedRepo.id)
      if (!result.success) {
         // Revert
         setRepos(prevRepos)
         if (selectedRepo) setSelectedRepo(selectedRepo)
         alert("Failed to delete repository: " + (result.error || "Unknown error"))
      } else {
         router.refresh()
      }
    } catch (e) {
      setRepos(prevRepos)
      alert("Error deleting repository")
    }
    setIsDeleting(false)
  }

  const showList = !isMobileView || !selectedRepo
  const showDetails = !isMobileView || selectedRepo

  return (
    <div className="flex h-[calc(100vh-65px)] lg:h-screen overflow-hidden bg-background">
      {/* Repo List Sidebar */}
      <div className={`${showList ? 'flex' : 'hidden'} w-full md:w-80 border-r border-border/10 flex-col bg-card/30 backdrop-blur-sm`}>
        <div className="p-4 border-b border-border/10 flex items-center justify-between sticky top-0 bg-background/80 backdrop-blur-md z-10">
          <h2 className="text-sm font-semibold">Your Repositories</h2>
          
          <AddRepoModal>
             <Button size="sm" variant="outline" className="h-8 px-3 text-xs gap-1.5 border-none bg-secondary/50 hover:bg-secondary text-foreground transition-all shadow-none">
                <Plus className="h-3.5 w-3.5" />
                Add
              </Button>
          </AddRepoModal>
        </div>

        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {repos.length > 0 ? (
            repos.map((ur: any) => {
              const repo = ur.repositories
              return (
                <button
                  key={repo.id}
                  onClick={() => setSelectedRepo(repo)}
                  className={`w-full text-left p-3 rounded-xl border border-transparent text-xs transition-all group relative overflow-hidden ${
                    selectedRepo?.id === repo.id
                      ? 'bg-primary/5 shadow-none ring-0'
                      : 'hover:bg-accent/50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    {repo.image_url ? (
                      <div className="w-9 h-9 rounded-lg relative overflow-hidden shrink-0 shadow-sm border-none bg-muted">
                        <Image src={repo.image_url} alt={repo.name} fill className="object-cover" />
                      </div>
                    ) : (
                      <div className="w-9 h-9 rounded-lg bg-muted flex items-center justify-center shrink-0 font-bold text-muted-foreground">
                        {repo.name[0]?.toUpperCase()}
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <div className={`font-semibold truncate text-sm mb-0.5 ${selectedRepo?.id === repo.id ? 'text-primary' : 'text-foreground'}`}>
                        {repo.name}
                      </div>
                      <div className="text-[10px] text-muted-foreground truncate opacity-70 group-hover:opacity-100 transition-opacity">
                         {repo.full_name}
                      </div>
                    </div>
                  </div>
                </button>
              )
            })
          ) : (
             <div className="flex flex-col items-center justify-center h-64 text-center px-4">
              <div className="w-12 h-12 rounded-full bg-muted/50 flex items-center justify-center mb-3">
                <Plus className="h-5 w-5 text-muted-foreground" />
              </div>
              <p className="text-sm font-medium mb-1">No repositories</p>
              <AddRepoModal>
                <Button variant="link" size="sm" className="text-xs">Add your first repository</Button>
              </AddRepoModal>
             </div>
          )}
        </div>
      </div>

      {/* Repo Details Main Content */}
       <div className={`${showDetails ? 'flex' : 'hidden'} flex-1 flex-col bg-background/50 relative overflow-hidden`}>
        {selectedRepo ? (
          <>
            {/* Mobile Header for Details */}
            <div className="md:hidden p-3 border-b border-border/10 flex items-center gap-2 sticky top-0 bg-background/95 backdrop-blur-sm z-20">
              <Button variant="ghost" size="icon" className="h-8 w-8 -ml-1" onClick={() => setSelectedRepo(null)}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="font-semibold text-sm truncate flex-1">{selectedRepo.name}</span>
              {saveStatus === 'saving' && <span className="text-[10px] text-muted-foreground animate-pulse mr-2">Saving...</span>}
            </div>

            <div className="flex-1 overflow-y-auto">
              <div className="p-4 md:p-8 max-w-3xl mx-auto w-full animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
                
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-6 mb-8 bg-card border-none rounded-2xl p-6 shadow-sm ring-1 ring-border/5">
                  <div className="flex items-start gap-5">
                     <div className="relative group">
                       {selectedRepo.image_url ? (
                        <div className="w-20 h-20 rounded-2xl relative overflow-hidden shadow-sm group-hover:ring-2 group-hover:ring-primary/20 transition-all cursor-pointer bg-muted">
                          <Image src={selectedRepo.image_url} alt={selectedRepo.name} fill className="object-cover" />
                        </div>
                      ) : (
                        <div className="w-20 h-20 rounded-2xl bg-muted flex items-center justify-center text-3xl font-bold shadow-sm group-hover:ring-2 group-hover:ring-primary/20 transition-all cursor-pointer">
                          {selectedRepo.name[0]?.toUpperCase()}
                        </div>
                      )}
                      
                      {/* Quick Upload Overlay */}
                      <label className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer rounded-2xl">
                        <Upload className="h-6 w-6 text-white drop-shadow-md" />
                        <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => {
                              const file = e.target.files?.[0]
                              if (file) handleImageUpload(file)
                            }}
                          />
                      </label>
                     </div>

                    <div className="pt-1">
                      <h1 className="text-2xl md:text-3xl font-bold tracking-tight">{selectedRepo.name}</h1>
                      <div className="flex items-center gap-2 mt-2">
                        <Link 
                          href={`/repo/${selectedRepo.owner}/${selectedRepo.name}`} 
                          className="text-xs font-medium px-2 py-1 rounded-md bg-secondary text-secondary-foreground hover:bg-secondary/80 transition-colors inline-flex items-center gap-1.5"
                          target="_blank"
                        >
                          View Public Page <ExternalLink className="h-3 w-3" />
                        </Link>
                        {saveStatus === 'saved' && (
                          <span className="text-xs text-green-500 flex items-center gap-1 animate-in fade-in duration-300">
                            <Save className="h-3 w-3" /> Saved
                          </span>
                        )}
                         {saveStatus === 'error' && (
                          <span className="text-xs text-destructive flex items-center gap-1 animate-in fade-in duration-300">
                            <AlertCircle className="h-3 w-3" /> Error saving
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <Button 
                    variant="destructive" 
                    size="sm" 
                    className="text-xs shrink-0 bg-red-600 hover:bg-red-700 text-white shadow-sm font-medium border border-red-700 transition-all hover:shadow-red-500/20"
                    onClick={() => setShowDeleteConfirm(true)}
                  >
                    <Trash2 className="h-3.5 w-3.5 mr-2" />
                    Delete Repo
                  </Button>

                  <Dialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
                    <DialogContent className="sm:max-w-md bg-white dark:bg-zinc-950 border border-border shadow-2xl animate-in zoom-in-95 duration-200">
                      <DialogHeader>
                        <DialogTitle>Are you absolutely sure?</DialogTitle>
                        <DialogDescription>
                          This action cannot be undone. This will permanently delete 
                          <span className="font-semibold text-foreground"> {selectedRepo.name} </span>
                          and remove your data from our servers.
                        </DialogDescription>
                      </DialogHeader>
                      <DialogFooter>
                        <Button variant="outline" onClick={() => setShowDeleteConfirm(false)}>Cancel</Button>
                        <Button 
                          variant="destructive" 
                          onClick={handleDelete}
                          disabled={isDeleting}
                        >
                          {isDeleting ? 'Deleting...' : 'Delete Repository'}
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </div>

                <div className="space-y-8">
                  {/* General Settings */}
                  <section>
                    <h3 className="text-sm font-semibold mb-4 flex items-center gap-2 text-muted-foreground uppercase tracking-wider text-[11px]">General Settings</h3>
                    <div className="space-y-4">
                      {/* Name */}
                      <div className="grid gap-2">
                        <label className="text-sm font-medium">Repository Name</label>
                        <input
                          type="text"
                          value={selectedRepo.name}
                          onChange={(e) => handleChange('name', e.target.value)}
                          onBlur={(e) => handleSave('name', e.target.value)}
                          className="w-full px-3 py-2 bg-background border border-border/10 rounded-lg text-sm focus:ring-1 focus:ring-primary transition-all shadow-sm focus:border-primary/50"
                          maxLength={100}
                        />
                      </div>

                      {/* Description */}
                      <div className="grid gap-2">
                        <div className="flex justify-between">
                          <label className="text-sm font-medium">Description</label>
                          <span className="text-[10px] text-muted-foreground">{selectedRepo.description?.length || 0}/200</span>
                        </div>
                        <textarea
                          value={selectedRepo.description || ''}
                          onChange={(e) => handleChange('description', e.target.value)}
                          onBlur={(e) => handleSave('description', e.target.value)}
                          className="w-full px-3 py-2 bg-background border border-border/10 rounded-lg text-sm min-h-[120px] focus:ring-1 focus:ring-primary transition-all resize-none shadow-sm leading-relaxed focus:border-primary/50"
                          maxLength={200}
                          placeholder="Describe your repository..."
                        />
                      </div>
                    </div>
                  </section>
                  
                  <div className="border-t border-border/10 my-6" />

                   {/* Additional Details */}
                   <section>
                    <h3 className="text-sm font-semibold mb-4 flex items-center gap-2 text-muted-foreground uppercase tracking-wider text-[11px]">Additional Details</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                      <div className="grid gap-2">
                        <label className="text-sm font-medium">Category</label>
                        <select className="w-full px-3 py-2 bg-background border border-border/10 rounded-lg text-sm focus:ring-1 focus:ring-primary transition-all shadow-sm cursor-pointer focus:border-primary/50">
                          <option>SaaS</option>
                          <option>Mobile App</option>
                          <option>Library / SDK</option>
                          <option>Dev Tool</option>
                          <option>Open Source</option>
                          <option>Other</option>
                        </select>
                      </div>

                      <div className="grid gap-2">
                        <label className="text-sm font-medium">Primary Language</label>
                        <input
                          type="text"
                          value={selectedRepo.language || ''}
                          readOnly
                          className="w-full px-3 py-2 bg-muted/50 border border-border/10 rounded-lg text-sm text-muted-foreground cursor-not-allowed shadow-none"
                        />
                      </div>
                    </div>
                  </section>
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-muted-foreground bg-muted/5">
            <div className="w-20 h-20 rounded-3xl bg-card border border-border/50 shadow-sm flex items-center justify-center mb-6 rotate-3">
               <ExternalLink className="h-8 w-8 opacity-20" />
            </div>
            <h3 className="text-xl font-semibold mb-2 text-foreground">Select a repository</h3>
            <p className="text-sm max-w-xs text-muted-foreground/80 leading-relaxed">Choose a repository from the sidebar to view details, edit settings, and manage visibility.</p>
          </div>
        )}
      </div>
    </div>
  )
}
