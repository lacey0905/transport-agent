import { formatMinutes } from './ui'

export function ArrivalSlot({
  label,
  minutes,
  stopsAway,
  plate,
  lowPlate,
  tone = 'bus',
}: {
  label: string
  minutes: number | null
  stopsAway: number | null
  plate?: string | null
  lowPlate?: boolean
  tone?: 'bus' | 'rail' | 'shuttle'
}) {
  const urgent = minutes !== null && minutes <= 3
  const toneClass =
    tone === 'rail' ? ' slot--rail' : tone === 'shuttle' ? ' slot--shuttle' : ''

  return (
    <article className={`slot${urgent ? ` slot--urgent${toneClass}` : ''}`}>
      <p className="slot__label">{label}</p>
      <p className="slot__time">{formatMinutes(minutes)}</p>
      <p className="slot__meta">
        {stopsAway !== null ? `${stopsAway}정류장 전` : '위치 정보 없음'}
        {lowPlate ? ' · 저상' : ''}
      </p>
      {plate ? <p className="slot__plate">{plate}</p> : null}
    </article>
  )
}
