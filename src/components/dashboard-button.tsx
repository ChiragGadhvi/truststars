'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { usePathname } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { motion } from 'framer-motion'

export default function DashboardButton() {
  const [user, setUser] = useState<any>(null)
  const pathname = usePathname()

  useEffect(() => {
    const supabase = createClient()
    
    // Check initial user
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
    }
    checkUser()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      // Immediately set user to null on sign out even if session might linger slightly
      if (event === 'SIGNED_OUT') {
        setUser(null)
      } else {
        setUser(session?.user ?? null)
      }
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  // Hide on dashboard pages
  if (!user || pathname?.startsWith('/dashboard')) return null

  return (
    <motion.div 
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="fixed top-4 left-4 z-50"
    >
      <Link href="/dashboard/repos">
        <Button variant="outline" size="sm" className="text-xs flex items-center gap-2 shadow-lg">
          <div className="w-5 h-5 rounded-full bg-muted relative overflow-hidden">
            {user.user_metadata?.avatar_url && (
              <Image 
                src={user.user_metadata.avatar_url} 
                alt="Profile" 
                fill 
                className="object-cover" 
              />
            )}
          </div>
          Dashboard
        </Button>
      </Link>
    </motion.div>
  )
}
