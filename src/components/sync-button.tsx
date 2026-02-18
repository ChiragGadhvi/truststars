'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { RefreshCw, Check, AlertCircle } from 'lucide-react'
import { syncAllRepositories } from '@/actions/github'
import { useRouter } from 'next/navigation'

export function SyncButton() {
  const [loading, setLoading] = useState(false)
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle')
  const router = useRouter()

  const handleSync = async () => {
    setLoading(true)
    setStatus('idle')
    try {
      const result = await syncAllRepositories()
      if (result.success) {
        setStatus('success')
        router.refresh()
        // Reset success after 3 seconds
        setTimeout(() => setStatus('idle'), 3000)
      } else {
        setStatus('error')
      }
    } catch (err) {
      console.error(err)
      setStatus('error')
    }
    setLoading(false)
  }

  return (
    <Button 
      variant="outline" 
      size="sm" 
      className="text-xs h-8" 
      onClick={handleSync} 
      disabled={loading}
    >
      {loading ? (
        <>
          <RefreshCw className="mr-2 h-3.5 w-3.5 animate-spin" />
          Syncing...
        </>
      ) : status === 'success' ? (
        <>
          <Check className="mr-2 h-3.5 w-3.5 text-green-500" />
          Synced
        </>
      ) : status === 'error' ? (
        <>
          <AlertCircle className="mr-2 h-3.5 w-3.5 text-red-500" />
          Failed
        </>
      ) : (
        <>
          <RefreshCw className="mr-2 h-3.5 w-3.5" />
          Sync Stars
        </>
      )}
    </Button>
  )
}
