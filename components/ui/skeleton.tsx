import { cn } from '@/lib/utils'

function Skeleton({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="skeleton"
      className={cn('bg-accent animate-pulse rounded-md', className)}
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
      className={cn('bg-accent animate-pulse rounded-md h-4 w-full', className)}
      {...props}
    />
  )
}

interface SkeletonCardProps extends React.ComponentProps<'div'> {
  className?: string
  count?: number
}

function SkeletonCard({ className, count = 3, ...props }: SkeletonCardProps) {
  return (
    <div
      data-slot="skeleton-card"
      className={cn('space-y-3 p-4', className)}
      {...props}
    >
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonLine key={i} className={i === 0 ? 'w-3/4' : i === count - 1 ? 'w-1/2' : 'w-full'} />
      ))}
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
        'bg-accent animate-pulse',
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
      className={cn('space-y-2', className)}
      {...props}
    >
      {Array.from({ length: rows }).map((_, rowIdx) => (
        <div
          key={rowIdx}
          className="flex gap-3"
        >
          {Array.from({ length: columns }).map((_, colIdx) => (
            <SkeletonLine
              key={colIdx}
              className={colIdx === 0 ? 'flex-1' : 'flex-1'}
            />
          ))}
        </div>
      ))}
    </div>
  )
}

export { Skeleton, SkeletonLine, SkeletonCard, SkeletonAvatar, SkeletonTable }
