'use client'

import { useState } from 'react'
import { updateProfile } from '@/actions/user'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Loader2, User, Globe, Link as LinkIcon, Save, Check } from 'lucide-react'
import Image from 'next/image'

interface ProfileData {
  full_name?: string
  username?: string
  website?: string
  twitter?: string
  linkedin?: string
  bio?: string
  avatar_url?: string
}

export default function ProfileForm({ initialData }: { initialData: ProfileData }) {
  const [formData, setFormData] = useState(initialData)
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
    setSuccess(false)
    setError(null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setSuccess(false)

    try {
      const result: any = await updateProfile({
        full_name: formData.full_name,
        username: formData.username,
        website: formData.website,
        twitter: formData.twitter,
        linkedin: formData.linkedin,
        bio: formData.bio
      })

      if (result.error) {
        setError(result.error)
      } else {
        setSuccess(true)
        setTimeout(() => setSuccess(false), 3000)
      }
    } catch (err) {
      console.error(err)
      setError("Failed to update profile")
    }
    setLoading(false)
  }

  return (
    <div className="max-w-4xl mx-auto p-6 md:p-8 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      <div className="flex flex-col md:flex-row gap-8 items-start">
        {/* Avatar Section */}
        <div className="flex-shrink-0">
          <div className="relative group">
            <div className="w-24 h-24 md:w-32 md:h-32 rounded-full overflow-hidden border-4 border-card shadow-lg ring-1 ring-border/20 bg-muted flex items-center justify-center relative">
              {formData.avatar_url ? (
                <Image 
                  src={formData.avatar_url} 
                  alt="Profile" 
                  fill 
                  className="object-cover rounded-full" 
                />
              ) : (
                <User className="w-12 h-12 text-muted-foreground opacity-50" />
              )}
            </div>
            {/* Avatar upload usually handled by separate flow or same logical flow if supprot */}
            <div className="absolute bottom-0 right-0 bg-primary text-primary-foreground rounded-full p-1.5 shadow-md border-2 border-background">
               <User className="w-4 h-4" />
            </div>
          </div>
        </div>

        <div className="flex-1 space-y-1">
          <h1 className="text-2xl font-bold tracking-tight">Profile Settings</h1>
          <p className="text-muted-foreground">Manage your public profile and account details.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        
        {/* ... form fields ... */}

        <div className="grid gap-6 md:grid-cols-2">
           {/* ... */}
        </div>
        
        {/* ... Bio, Socials ... */}
        
        <div className="flex items-center gap-4 pt-4">
          <Button 
            type="submit" 
            disabled={loading} 
            className="min-w-[140px] bg-white text-black hover:bg-gray-200 border border-gray-200 shadow-sm font-semibold transition-all"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...
              </>
            ) : success ? (
              <>
                 <Check className="mr-2 h-4 w-4" /> Saved
              </>
            ) : (
              <>
                 <Save className="mr-2 h-4 w-4" /> Save Changes
              </>
            )}
          </Button>
          {error && <p className="text-sm text-destructive font-medium">{error}</p>}
        </div>
      </form>
    </div>
  )
}
