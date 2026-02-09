'use client'

import { usePathname } from 'next/navigation'
import Footer from './footer'

export function MainFooter() {
  const pathname = usePathname()

  if (pathname?.startsWith('/dashboard')) {
    return null
  }

  return (
    <div className="container mx-auto px-4 pb-8 mt-auto max-w-5xl">
      <Footer />
    </div>
  )
}
