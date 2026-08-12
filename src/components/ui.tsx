export function formatMinutes(min: number | null): string {
  if (min === null) return '—'
  if (min <= 0) return '도착'
  return `${min}분`
}

export function modeBadgeClass(mode: string): string {
  if (mode === 'shuttle') return 'badge badge--shuttle badge--icon'
  if (mode.includes('602')) return 'badge badge--village badge--icon'
  if (mode === '380') return 'badge badge--icon'
  return 'badge badge--rail badge--icon'
}

export function modeIcon(mode: string): string {
  if (mode === 'shuttle') return 'airport_shuttle'
  if (mode.includes('602')) return 'directions_bus'
  if (mode === '380') return 'directions_bus'
  return 'train'
}
