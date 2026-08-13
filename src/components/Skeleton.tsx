export function Skeleton({
  className = '',
}: {
  className?: string
}) {
  return <span className={`skel ${className}`.trim()} aria-hidden />
}

export function CommuteSkeleton() {
  return (
    <article className="commute__best" aria-busy="true" aria-label="경로 불러오는 중">
      <div className="commute__best-top">
        <Skeleton className="skel--badge" />
        <Skeleton className="skel--chip" />
      </div>
      <Skeleton className="skel--line skel--w40" />
      <Skeleton className="skel--title" />
      <Skeleton className="skel--line" />
      <div className="skel-stack">
        <Skeleton className="skel--row" />
        <Skeleton className="skel--row" />
        <Skeleton className="skel--row" />
        <Skeleton className="skel--row" />
      </div>
    </article>
  )
}

export function PanelBodySkeleton({ rows = 4 }: { rows?: number }) {
  return (
    <div className="skel-stack" aria-busy="true" aria-label="불러오는 중">
      <Skeleton className="skel--slot" />
      {Array.from({ length: rows }, (_, i) => (
        <Skeleton key={i} className="skel--row" />
      ))}
    </div>
  )
}
