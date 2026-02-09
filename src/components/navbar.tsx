
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Button } from './ui/button'
import { UserNav } from './user-nav'
import { signInWithGithub } from '@/actions/auth' 
import { Star } from 'lucide-react'

export async function Navbar() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  return (
    <nav className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 items-center">
        <Link href="/" className="mr-8 flex items-center space-x-2 group">
          <div className="flex items-center justify-center w-7 h-7 rounded border border-border group-hover:bg-accent transition-colors">
            <Star className="h-4 w-4" />
          </div>
          <span className="hidden font-bold sm:inline-block text-sm">
            TrustStars
          </span>
        </Link>
        
        <div className="flex flex-1 items-center justify-between space-x-2 md:justify-end">
          <nav className="flex items-center space-x-6">
            <Link
              href="/leaderboard"
              className="text-xs font-medium transition-colors hover:text-foreground text-muted-foreground"
            >
              Leaderboard
            </Link>
          </nav>
          
          <div className="flex items-center space-x-4">
            {user ? (
              <UserNav user={user} />
            ) : (
              <form action={signInWithGithub}>
                <Button variant="default" size="sm" className="text-xs">
                  Sign In with GitHub
                </Button>
              </form>
            )}
          </div>
        </div>
      </div>
    </nav>
  )
}
