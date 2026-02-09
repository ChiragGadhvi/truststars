'use client'

import { useState } from 'react'
import { updateProfile } from '@/actions/user'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Loader2, User, Globe, Check, Save } from 'lucide-react'
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

      if (result && result.error) {
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
        
        <div className="grid gap-6 md:grid-cols-2">
          {/* Full Name */}
          <div className="space-y-2">
            <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">Full Name</label>
            <Input 
              name="full_name" 
              value={formData.full_name || ''} 
              onChange={handleChange} 
              placeholder="e.g. John Doe" 
            />
          </div>

          {/* Username */}
          <div className="space-y-2">
            <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">Username</label>
             <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">@</span>
              <Input 
                name="username" 
                value={formData.username || ''} 
                onChange={handleChange} 
                className="pl-7" 
                placeholder="username" 
              />
            </div>
          </div>
        </div>

        {/* Bio */}
        <div className="space-y-2">
          <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">Bio</label>
          <Textarea 
            name="bio" 
            value={formData.bio || ''} 
            onChange={handleChange} 
            placeholder="Tell us about yourself or your company..." 
            className="min-h-[100px]"
            maxLength={160}
          />
          <div className="text-right text-xs text-muted-foreground">
            {(formData.bio?.length || 0)}/160
          </div>
        </div>

        <div className="space-y-4">
           <h3 className="text-lg font-semibold border-b border-border/50 pb-2">Social Links</h3>
           
           <div className="grid gap-6 md:grid-cols-2">
              {/* Website */}
              <div className="space-y-2">
                <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 flex items-center gap-2">
                  <Globe className="w-3.5 h-3.5" /> Website
                </label>
                <Input 
                  name="website" 
                  value={formData.website || ''} 
                  onChange={handleChange} 
                  placeholder="https://example.com" 
                />
              </div>

               {/* Twitter */}
              <div className="space-y-2">
                <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 flex items-center gap-2">
                  <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zl-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
                  Twitter / X
                </label>
                 <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">@</span>
                  <Input 
                    name="twitter" 
                    value={formData.twitter || ''} 
                    onChange={handleChange} 
                    className="pl-7" 
                    placeholder="handle" 
                  />
                </div>
              </div>

               {/* LinkedIn */}
              <div className="space-y-2">
                <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 flex items-center gap-2">
                   <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor"><path d="M20.5 2h-17A1.5 1.5 0 002 3.5v17A1.5 1.5 0 003.5 22h17a1.5 1.5 0 001.5-1.5v-17A1.5 1.5 0 0020.5 2zM8 19H5v-9h3zM6.5 8.25A1.75 1.75 0 118.3 6.5a1.78 1.78 0 01-1.8 1.75zM19 19h-3v-4.74c0-1.21-.43-1.56-1.1-1.56-.91 0-1.96.77-1.96 2v4.3h-3v-9h3v1.2c.5-.76 1.38-1.46 3-1.46C18.66 9.75 19 11.23 19 14z"/></svg>
                   LinkedIn
                </label>
                <Input 
                  name="linkedin" 
                  value={formData.linkedin || ''} 
                  onChange={handleChange} 
                  placeholder="https://linkedin.com/in/..." 
                />
              </div>
           </div>
        </div>

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
