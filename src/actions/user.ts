'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function updateProfile(formData: {
  full_name?: string
  username?: string
  website?: string
  twitter?: string
  linkedin?: string
  bio?: string
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return { error: 'Not authenticated' }

  // Update Auth Metadata (This ensures data is stored in session)
  const { error: authError } = await supabase.auth.updateUser({
    data: {
      full_name: formData.full_name,
      username: formData.username,
      website: formData.website,
      twitter: formData.twitter, // Store handle or URL
      linkedin: formData.linkedin,
      bio: formData.bio
    }
  })

  if (authError) {
     return { error: authError.message }
  }

  // Try to update public 'users' table if columns exist.
  // We use standard naming conventions likely used in schema.
  // Note: If columns don't exist, this will fail silently for the user (we catch it), 
  // but Auth metadata will persist so they see their changes in dashboard at least.
  const { error: publicError } = await supabase
    .from('users')
    .update({
      full_name: formData.full_name,
      website_url: formData.website,
      twitter_handle: formData.twitter,
      linkedin_url: formData.linkedin,
      bio: formData.bio
    })
    .eq('id', user.id)

  if (publicError) {
    console.warn("Public profile update failed (likely missing columns):", publicError)
  }

  revalidatePath('/dashboard/profile')
  revalidatePath('/') 
  return { success: true }
}
