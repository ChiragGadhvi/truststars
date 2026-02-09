import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import ProfileForm from './profile-form'

export const dynamic = 'force-dynamic'

export default async function ProfilePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/')
  }

  // Use 'any' for publicProfile to avoid TS errors if columns missing in types
  const { data: publicProfile } = await supabase.from('users').select('*').eq('id', user.id).single()

  const m = user.user_metadata || {}
  const p: any = publicProfile || {}

  const initialData = {
    full_name: m.full_name || p.full_name || '',
    username: m.username || m.user_name || p.username || '',
    website: m.website || p.website_url || '',
    twitter: m.twitter || p.twitter_handle || '',
    linkedin: m.linkedin || p.linkedin_url || '',
    bio: m.bio || p.bio || '',
    avatar_url: m.avatar_url || p.avatar_url || ''
  }

  return <ProfileForm initialData={initialData} />
}
