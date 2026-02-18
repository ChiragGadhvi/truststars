
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Plus, Star, GitFork, Package } from 'lucide-react'
import { SyncButton } from '@/components/sync-button'

export default async function Dashboard() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/')
  }

  // Fetch verified repos
  const { data: userRepos } = await supabase
    .from('user_repositories')
    .select('*, repositories(*)')
    .eq('user_id', user.id)

  return (
    <div className="container py-8 px-4">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-3">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold mb-1">Your Dashboard</h1>
          <p className="text-xs text-muted-foreground">
            Manage your verified repositories
          </p>
        </div>
        <div className="flex items-center gap-2">
          <SyncButton />
          <Link href="/dashboard/add">
            <Button size="sm" className="text-xs h-8">
              <Plus className="mr-2 h-3.5 w-3.5" /> Add Repository
            </Button>
          </Link>
        </div>
      </div>

      <div className="grid gap-3">
        {(!userRepos || userRepos.length === 0) ? (
          <div className="text-center py-16 border border-dashed rounded-lg bg-card">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full border border-border mb-4">
              <Package className="h-6 w-6" />
            </div>
            <h3 className="text-sm font-semibold mb-1">No repositories added</h3>
            <p className="text-xs text-muted-foreground mb-4 max-w-md mx-auto">
              Start tracking your open source traction by adding your first repository.
            </p>
            <Link href="/dashboard/add">
              <Button variant="outline" size="sm" className="text-xs">
                <Plus className="mr-2 h-3.5 w-3.5" />
                Add your first repository
              </Button>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {userRepos.map((ur: any) => {
              const repo = ur.repositories
              return (
                <Link
                  key={ur.id}
                  href={`/repo/${repo.owner}/${repo.name}`}
                  className="group block"
                >
                  <div className="rounded-lg border border-border bg-card p-4 hover:bg-accent/50 transition-all h-full flex flex-col">
                    <div className="flex-1">
                      <div className="flex items-start justify-between mb-2">
                        <h3 className="font-semibold text-sm leading-tight group-hover:underline line-clamp-1">
                          {repo.name}
                        </h3>
                        {ur.role === 'owner' && (
                          <span className="border border-border text-xs px-1.5 py-0.5 rounded font-medium shrink-0 ml-2">
                            Owner
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground line-clamp-2 mb-3">
                        {repo.description || "No description provided."}
                      </p>
                    </div>
                    <div className="flex items-center justify-between pt-3 border-t border-border">
                      <div className="flex items-center gap-3 text-xs">
                        <div className="flex items-center gap-1 text-muted-foreground">
                          <Star className="h-3 w-3" />
                          <span className="font-medium">{repo.stars.toLocaleString()}</span>
                        </div>
                        <div className="flex items-center gap-1 text-muted-foreground">
                          <GitFork className="h-3 w-3" />
                          <span className="font-medium">{repo.forks.toLocaleString()}</span>
                        </div>
                      </div>
                      {repo.language && (
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <div className="w-1.5 h-1.5 rounded-full bg-foreground" />
                          <span>{repo.language}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
