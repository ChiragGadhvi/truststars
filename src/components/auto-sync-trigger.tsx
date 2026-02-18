'use client'

import { useEffect } from 'react'

export function AutoSyncTrigger() {
  useEffect(() => {
    // We hit the sync endpoint in the background
    const triggerSync = () => {
      fetch('/api/sync').catch(err => console.error("Auto-sync trigger failed:", err))
    }

    triggerSync() // Trigger immediately on mount

    // Set interval for every 15 minutes (15 * 60 * 1000 ms)
    const interval = setInterval(triggerSync, 15 * 60 * 1000)

    return () => clearInterval(interval)
  }, [])

  return null
}
