import { cn } from "@/lib/utils"

function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("rounded-md bg-muted/50 animate-pulse", className)}
      style={{
        animationDuration: '2s',
        animationTimingFunction: 'ease-in-out'
      }}
      {...props}
    />
  )
}

export { Skeleton }
