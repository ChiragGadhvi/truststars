import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import ReposClient from './repos-client'

export const dynamic = 'force-dynamic'

export default async function MyReposPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/')
  }

  const { data } = await supabase
    .from('user_repositories')
    .select('*, repositories(*)')
    .eq('user_id', user.id)

  return <ReposClient initialRepos={data || []} user={user} />
}
