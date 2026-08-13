import { SHUTTLE, type ShuttleSnapshot } from '../data/shuttle'
import { Panel } from './Panel'
import { PanelBodySkeleton } from './Skeleton'
import { formatMinutes } from './ui'

export function ShuttlePanel({
  shuttle,
  refreshing = false,
}: {
  shuttle: ShuttleSnapshot
  refreshing?: boolean
}) {
  const next = shuttle.next
  const urgent = next !== null && next.inMin <= 5
  const hint = next
    ? `다음 ${formatMinutes(next.inMin)} · ${next.time}`
    : '운행 시간 외'

  return (
    <Panel
      icon="airport_shuttle"
      badgeClass="badge--shuttle"
      title="셔틀버스"
      hint={refreshing ? '불러오는 중' : hint}
    >
      {refreshing ? <PanelBodySkeleton rows={4} /> : null}
      {!refreshing && next ? (
        <article
          className={`slot${urgent ? ' slot--urgent slot--shuttle' : ''}`}
        >
          <p className="slot__label">
            다음 {next.period} · {next.index}회차
          </p>
          <p className="slot__time">{formatMinutes(next.inMin)}</p>
          <p className="slot__meta">
            출발 {next.time}
            {next.inMin === 0 ? ' · 지금' : ''}
          </p>
          {shuttle.etaMin !== null ? (
            <p className="slot__plate">도착 예상 약 {shuttle.etaMin}분 후</p>
          ) : null}
        </article>
      ) : !refreshing ? (
        <p className="state">예정된 셔틀이 없습니다</p>
      ) : null}

      {!refreshing ? (
        <>
          <p className="shuttle__meta">
            {shuttle.active
              ? `현재 ${shuttle.active.period} 운행 · 배차 ${shuttle.active.intervalMin}분`
              : '출근 08:05~10:05 · 퇴근 17:00~21:00'}
          </p>
          <p className="rail__note">
            소요 약 {SHUTTLE.travelMin}분 · {SHUTTLE.travelNote}
          </p>

          {shuttle.upcoming.length > 0 ? (
            <ul className="shuttle__list">
              {shuttle.upcoming.map((item) => (
                <li key={`${item.period}-${item.time}`}>
                  <span>
                    {item.period} {item.time}
                  </span>
                  <span>{item.inMin === 0 ? '지금' : `${item.inMin}분`}</span>
                </li>
              ))}
            </ul>
          ) : null}
        </>
      ) : null}
    </Panel>
  )
}
