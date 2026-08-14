import type { ReactNode } from 'react'
import { Icon } from './Icon'

export function Panel({
  icon,
  badgeClass,
  title,
  hint,
  children,
}: {
  icon: string
  badgeClass?: string
  title: string
  hint: string
  children: ReactNode
}) {
  return (
    <details className="panel">
      <summary className="panel__summary">
        <span className={`badge badge--icon ${badgeClass ?? ''}`.trim()}>
          <Icon name={icon} />
        </span>
        <span className="panel__summary-text">
          <strong>{title}</strong>
          <span>{hint}</span>
        </span>
        <Icon name="expand_more" className="panel__chevron" />
      </summary>
      <div className="panel__body">{children}</div>
    </details>
  )
}
