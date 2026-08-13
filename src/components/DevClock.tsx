import { useState } from 'react'
import { Icon } from './Icon'

const AUTO_REFRESH_KEY = 'pangyo-dev-auto-refresh'

export function readDevAutoRefresh(): boolean {
  if (!import.meta.env.DEV) return true
  try {
    const stored = localStorage.getItem(AUTO_REFRESH_KEY)
    if (stored === null) return true
    return stored === '1'
  } catch {
    return true
  }
}

export function writeDevAutoRefresh(on: boolean): void {
  try {
    localStorage.setItem(AUTO_REFRESH_KEY, on ? '1' : '0')
  } catch {
    // 시크릿 모드 등
  }
}

const PRESETS = [
  { label: '08:00', value: '08:00' },
  { label: '14:59', value: '14:59' },
  { label: '15:00', value: '15:00' },
  { label: '18:00', value: '18:00' },
] as const

export function applyClockOverride(hhmm: string | null, base = new Date()): Date {
  if (!hhmm) return base
  const [h, m] = hhmm.split(':').map(Number)
  const next = new Date(base)
  next.setHours(h, m, 0, 0)
  return next
}

export function DevClock({
  value,
  onChange,
  autoRefresh,
  onAutoRefreshChange,
}: {
  value: string | null
  onChange: (hhmm: string | null) => void
  autoRefresh: boolean
  onAutoRefreshChange: (on: boolean) => void
}) {
  const [open, setOpen] = useState(false)

  if (!import.meta.env.DEV) return null

  return (
    <div className={`dev-clock${open ? ' dev-clock--open' : ''}`}>
      <button
        type="button"
        className="dev-clock__fab"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-label="개발용 시각 변경"
      >
        <Icon name="schedule" />
        {value ?? 'DEV'}
      </button>
      {open ? (
        <div className="dev-clock__panel">
          <p className="dev-clock__title">로컬 시각</p>
          <input
            type="time"
            className="dev-clock__input"
            value={value ?? ''}
            onChange={(e) => onChange(e.target.value || null)}
          />
          <div className="dev-clock__presets">
            {PRESETS.map((p) => (
              <button
                key={p.value}
                type="button"
                className={`dev-clock__chip${value === p.value ? ' dev-clock__chip--on' : ''}`}
                onClick={() => onChange(p.value)}
              >
                {p.label}
              </button>
            ))}
          </div>
          <button
            type="button"
            className="dev-clock__reset"
            onClick={() => onChange(null)}
          >
            실제 시각
          </button>
          <label className="dev-clock__toggle">
            <input
              type="checkbox"
              checked={autoRefresh}
              onChange={(e) => onAutoRefreshChange(e.target.checked)}
            />
            <span>자동 갱신</span>
          </label>
        </div>
      ) : null}
    </div>
  )
}
