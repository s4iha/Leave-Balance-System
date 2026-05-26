import { cn } from '@/lib/utils'

function Skeleton({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="skeleton"
      className={cn('bg-primary/10 animate-pulse rounded-md', className)}
      {...props}
    />
  )
}

interface SkeletonLineProps extends React.ComponentProps<'div'> {
  className?: string
}

function SkeletonLine({ className, ...props }: SkeletonLineProps) {
  return (
    <div
      data-slot="skeleton-line"
      className={cn('bg-primary/10 animate-pulse rounded-md h-4 w-full', className)}
      {...props}
    />
  )
}

interface SkeletonCardProps extends React.ComponentProps<'div'> {
  className?: string
}

function SkeletonCard({ className, ...props }: SkeletonCardProps) {
  return (
    <div
      data-slot="skeleton-card"
      className={cn('bg-card border border-border rounded-xl h-[140px] w-full p-6 flex flex-col justify-between', className)}
      {...props}
    >
      <div className="space-y-2">
        <div className="h-4 w-1/2 bg-primary/10 animate-pulse rounded-md" />
        <div className="h-8 w-3/4 bg-primary/10 animate-pulse rounded-md" />
      </div>
      <div className="h-3 w-1/3 bg-primary/5 animate-pulse rounded-md" />
    </div>
  )
}

interface SkeletonAvatarProps extends React.ComponentProps<'div'> {
  className?: string
  variant?: 'circle' | 'square'
}

function SkeletonAvatar({
  className,
  variant = 'circle',
  ...props
}: SkeletonAvatarProps) {
  return (
    <div
      data-slot="skeleton-avatar"
      className={cn(
        'bg-primary/10 animate-pulse',
        variant === 'circle' ? 'rounded-full' : 'rounded-md',
        'w-10 h-10',
        className
      )}
      {...props}
    />
  )
}

interface SkeletonTableProps extends React.ComponentProps<'div'> {
  className?: string
  rows?: number
  columns?: number
}

function SkeletonTable({
  className,
  rows = 5,
  columns = 3,
  ...props
}: SkeletonTableProps) {
  return (
    <div
      data-slot="skeleton-table"
      className={cn('w-full border border-border rounded-xl bg-card overflow-hidden', className)}
      {...props}
    >
      <div className="h-12 bg-muted/50 border-b border-border flex items-center px-4 gap-4">
        {Array.from({ length: columns }).map((_, i) => (
          <div key={i} className="h-4 flex-1 bg-primary/10 animate-pulse rounded-md" />
        ))}
      </div>
      <div className="p-4 space-y-4">
        {Array.from({ length: rows }).map((_, rowIdx) => (
          <div
            key={rowIdx}
            className="flex gap-4"
          >
            {Array.from({ length: columns }).map((_, colIdx) => (
              <div
                key={colIdx}
                className="h-4 flex-1 bg-primary/5 animate-pulse rounded-md"
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}

export { Skeleton, SkeletonLine, SkeletonCard, SkeletonAvatar, SkeletonTable }
