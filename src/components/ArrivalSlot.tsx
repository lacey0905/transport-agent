import { formatMinutes } from './ui'

function formatLocation(
  stationName: string | null | undefined,
  stopsAway: number | null,
): string {
  const name = stationName?.trim() || null
  if (name && stopsAway !== null) return `${name} · ${stopsAway}개 전`
  if (name) return name
  if (stopsAway !== null) return `${stopsAway}개 전`
  return '위치 정보 없음'
}

export function ArrivalSlot({
  label,
  minutes,
  stopsAway,
  stationName,
  plate,
  tone = 'bus',
}: {
  label: string
  minutes: number | null
  stopsAway: number | null
  stationName?: string | null
  plate?: string | null
  tone?: 'bus' | 'rail' | 'shuttle'
}) {
  const urgent = minutes !== null && minutes <= 3
  const toneClass =
    tone === 'rail' ? ' slot--rail' : tone === 'shuttle' ? ' slot--shuttle' : ''

  return (
    <article className={`slot${urgent ? ` slot--urgent${toneClass}` : ''}`}>
      <p className="slot__label">{label}</p>
      <p className="slot__time">{formatMinutes(minutes)}</p>
      <p className="slot__meta">{formatLocation(stationName, stopsAway)}</p>
      {plate ? <p className="slot__plate">{plate}</p> : null}
    </article>
  )
}
