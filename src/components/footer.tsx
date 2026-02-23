
'use client'

import { useTheme } from 'next-themes'
import { Moon, Sun } from 'lucide-react'
import { useEffect, useState } from 'react'

export default function Footer() {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return null
  }

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark')
  }

  return (
    <footer className="pt-8  border-t flex flex-col sm:flex-row items-center justify-between gap-4">
      <div className="text-xs text-muted-foreground">
        Built by <span className="font-semibold text-foreground">Chirag Gadhvi</span>
      </div>

      <button
        onClick={toggleTheme}
        className="p-2 rounded-lg border border-border bg-background hover:bg-accent transition-colors"
        title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
      >
        {theme === 'dark' ? (
          <Sun className="h-4 w-4" />
        ) : (
          <Moon className="h-4 w-4" />
        )}
      </button>
    </footer>
  )
}
