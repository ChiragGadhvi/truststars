'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { useRouter, usePathname } from 'next/navigation'
import { FileText, User, LogOut, Plus, Menu, X, Home } from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'
import { signOut } from '@/actions/auth'
import { motion, AnimatePresence } from 'framer-motion'
import { AddRepoModal } from '@/components/add-repo-modal'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    const checkUser = async () => {
      const supabase = createClient()
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session?.user) {
        router.push('/')
      } else {
        setUser(session.user)
      }
      setLoading(false)
    }
    checkUser()
  }, [router])

  if (loading) {
    return <div className="min-h-screen bg-background flex items-center justify-center">Loading...</div>
  }

  if (!user) {
    return null
  }

  const navItems = [
    { href: '/dashboard/repos', icon: FileText, label: 'My Repositories' },
    { href: '/dashboard/profile', icon: User, label: 'My Profile' },
  ]

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile Header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-card border-b border-border">
        <div className="flex items-center justify-between p-4">
          <Link href="/" className="flex items-center gap-2">
            <Image src="/web-app-manifest-192x192.png" alt="TrustStars" width={32} height={32} className="rounded-lg" />
            <span className="text-lg font-bold">TrustStars</span>
          </Link>
          <button 
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 hover:bg-accent rounded-lg transition-colors"
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ type: 'tween', duration: 0.3 }}
            className="lg:hidden fixed inset-0 z-40 bg-card pt-16"
          >
            <nav className="p-4 space-y-2">
              <Link 
                href="/"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-3 px-4 py-3 text-sm rounded-lg hover:bg-accent transition-colors"
              >
                <Home className="h-5 w-5" />
                Home
              </Link>
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center gap-3 px-4 py-3 text-sm rounded-lg transition-colors ${
                    pathname === item.href ? 'bg-accent' : 'hover:bg-accent'
                  }`}
                >
                  <item.icon className="h-5 w-5" />
                  {item.label}
                </Link>
              ))}
              
              <AddRepoModal onRepoAdded={() => setMobileMenuOpen(false)}>
                <button
                  className="w-full flex items-center gap-3 px-4 py-3 text-sm rounded-lg bg-white text-black hover:bg-gray-200 transition-colors"
                >
                  <Plus className="h-5 w-5" />
                  Add Repository
                </button>
              </AddRepoModal>
            </nav>
            
            <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-border">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-full bg-muted relative overflow-hidden">
                  {user.user_metadata?.avatar_url && (
                    <Image 
                      src={user.user_metadata.avatar_url} 
                      alt="Profile" 
                      fill 
                      className="object-cover" 
                    />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium truncate">{user.email}</div>
                </div>
              </div>
              <form action={signOut}>
                <Button variant="outline" size="sm" className="w-full text-xs">
                  <LogOut className="h-3 w-3 mr-2" />
                  Log out
                </Button>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex">
        {/* Desktop Sidebar */}
        <aside className="hidden lg:flex w-64 border-r border-border bg-card flex-col fixed left-0 top-0 bottom-0">
          {/* Logo */}
          <div className="p-6 border-b border-border/10">
            <Link href="/" className="flex items-center gap-3">
              <Image src="/web-app-manifest-192x192.png" alt="TrustStars" width={40} height={40} className="rounded-lg shadow-sm" />
              <span className="text-xl font-bold">TrustStars</span>
            </Link>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-1">
            <Link 
              href="/"
              className="flex items-center gap-3 px-4 py-2.5 text-sm rounded-lg hover:bg-accent transition-colors text-muted-foreground hover:text-foreground"
            >
              <Home className="h-4 w-4" />
              Home
            </Link>
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-4 py-2.5 text-sm rounded-lg transition-colors ${
                  pathname === item.href ? 'bg-accent font-medium text-foreground' : 'hover:bg-accent text-muted-foreground hover:text-foreground'
                }`}
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </Link>
            ))}
            
            <AddRepoModal>
               <button
                className="w-full flex items-center gap-3 px-4 py-2.5 text-sm rounded-lg bg-white text-black hover:bg-gray-200 transition-colors mt-4 shadow-sm font-medium"
              >
                <Plus className="h-4 w-4" />
                Add Repository
              </button>
            </AddRepoModal>
          </nav>

          {/* User Info */}
          <div className="p-4 border-t border-border/10">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-full bg-muted relative overflow-hidden border border-border/20">
                {user.user_metadata?.avatar_url && (
                  <Image 
                    src={user.user_metadata.avatar_url} 
                    alt="Profile" 
                    fill 
                    className="object-cover" 
                  />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium truncate">{user.email}</div>
              </div>
            </div>
            <form action={signOut}>
              <Button variant="outline" size="sm" className="w-full text-xs">
                <LogOut className="h-3 w-3 mr-2" />
                Log out
              </Button>
            </form>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 lg:ml-64 pt-16 lg:pt-0">
          {children}
        </main>
      </div>
    </div>
  )
}
