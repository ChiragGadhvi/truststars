
import { Skeleton } from "@/components/ui/skeleton"

export default function Loading() {
  return (
    <div className="container py-8 max-w-6xl mx-auto px-4 animate-in fade-in duration-300">
      {/* Breadcrumb Navigation Skeleton */}
      <div className="flex items-center gap-2 mb-8">
        <Skeleton className="h-4 w-20" />
        <Skeleton className="h-4 w-4" />
        <Skeleton className="h-4 w-12" />
        <Skeleton className="h-4 w-4" />
        <Skeleton className="h-4 w-32" />
      </div>

      {/* Header Skeleton */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-6">
        <div className="max-w-3xl flex items-center gap-5 w-full">
          <Skeleton className="w-20 h-20 rounded-2xl shrink-0" />
          <div className="w-full">
            <Skeleton className="h-10 w-64 mb-2" />
            <Skeleton className="h-5 w-full max-w-lg mb-3" />
            
            <div className="flex items-center gap-4">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-24" />
            </div>
          </div>
        </div>
        <div className="shrink-0 self-start md:self-center">
          <Skeleton className="h-9 w-32" />
        </div>
      </div>

      {/* Developer Activity Section Skeleton */}
      <div className="mb-10">
        <Skeleton className="h-6 w-48 mb-4" />
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="p-5 rounded-xl border bg-card flex flex-col gap-2">
              <Skeleton className="w-10 h-10 rounded-lg mb-1" />
              <Skeleton className="h-8 w-16" />
              <Skeleton className="h-3 w-24" />
              <Skeleton className="h-2 w-20" />
            </div>
          ))}
        </div>

        {/* Charts Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[1, 2].map((i) => (
            <div key={i} className="bg-card rounded-xl border p-1 shadow-sm h-[300px] flex flex-col">
              <div className="px-4 py-3 border-b flex items-center justify-between">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-20" />
              </div>
              <div className="flex-1 p-4 flex items-end justify-center gap-2">
                {[...Array(10)].map((_, j) => (
                    <Skeleton key={j} className="w-full h-full rounded-t" style={{ height: `${Math.random() * 80 + 20}%` }} />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Secondary Stats Skeleton */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-10 py-6 border-t border-b border-border/40">
        {[1, 2, 3, 4].map((i) => (
           <div key={i} className="flex items-center gap-3 px-4">
              <Skeleton className="h-4 w-4 rounded-full" />
              <div>
                 <Skeleton className="h-6 w-16 mb-1" />
                 <Skeleton className="h-3 w-12" />
              </div>
           </div>
        ))}
      </div>

      {/* Maintainers Skeleton */}
      <div className="mb-8">
        <Skeleton className="h-6 w-48 mb-4" />
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="flex items-center gap-3 p-3 rounded-lg border bg-card">
              <Skeleton className="h-10 w-10 rounded-full" />
              <div className="flex-1">
                <Skeleton className="h-4 w-24 mb-1" />
                <Skeleton className="h-3 w-16" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
