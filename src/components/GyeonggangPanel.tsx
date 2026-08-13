import { useMemo, useState } from 'react'
import { isMorningWindow } from '../constants/commute'
import {
  getNextTrips,
  isWeekend,
  PANGYO_ARRIVALS,
  PANGYO_DEPARTURES,
  type GyeonggangTrip,
} from '../data/gyeonggang-weekday'
import { Icon } from './Icon'
import { Panel } from './Panel'
import { PanelBodySkeleton } from './Skeleton'
import { formatMinutes } from './ui'

type RailMode = 'morning' | 'evening'

export function GyeonggangPanel({
  now,
  refreshing = false,
}: {
  now: Date
  refreshing?: boolean
}) {
  const [mode, setMode] = useState<RailMode>(() =>
    isMorningWindow(now) ? 'morning' : 'evening',
  )
  const morning = mode === 'morning'
  const trips = morning ? PANGYO_ARRIVALS : PANGYO_DEPARTURES
  const direction = morning ? '초월 → 판교' : '판교 → 초월'
  const next = useMemo(() => getNextTrips(trips, now, 3), [trips, now])
  const nextKey = new Set(next.map((n) => `${n.trip.trainNo}-${n.trip.time}`))
  const weekend = isWeekend(now)
  const hint = next[0]
    ? `다음 ${formatMinutes(next[0].inMin)} · ${next[0].trip.time}`
    : '평일 시간표'

  return (
    <Panel
      icon="train"
      badgeClass="badge--rail"
      title="판교역 경강선"
      hint={refreshing ? '불러오는 중' : hint}
    >
      {refreshing ? <PanelBodySkeleton rows={6} /> : null}
      {!refreshing && weekend ? (
        <p className="state state--warn">
          <Icon name="warning" filled />
          오늘은 주말이에요. 아래는 평일 시각표라 실제와 다를 수 있어요. 현장·코레일
          공지를 확인해 주세요.
        </p>
      ) : null}

      {!refreshing ? (
      <div className="tabs" role="tablist" aria-label="출근 퇴근 전환">
        <button
          type="button"
          role="tab"
          aria-selected={morning}
          className={`tab tab--rail${morning ? ' tab--on' : ''}`}
          onClick={() => setMode('morning')}
        >
          <Icon name="login" />
          출근 {PANGYO_ARRIVALS.length}
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={!morning}
          className={`tab tab--rail${!morning ? ' tab--on' : ''}`}
          onClick={() => setMode('evening')}
        >
          <Icon name="logout" />
          퇴근 {PANGYO_DEPARTURES.length}
        </button>
      </div>
      ) : null}

      {!refreshing && next[0] ? (
        <article className="slot slot--urgent slot--rail">
          <p className="slot__label">
            다음 {morning ? '출근' : '퇴근'} · {next[0].trip.trainNo}
          </p>
          <p className="slot__time">{formatMinutes(next[0].inMin)}</p>
          <p className="slot__meta">
            {next[0].trip.time} · {direction}
          </p>
        </article>
      ) : null}

      {!refreshing ? (
        <>
      <ul className="rail__list">
        {trips.map((trip: GyeonggangTrip) => {
          const key = `${trip.trainNo}-${trip.time}`
          const upcoming = next.find(
            (n) => `${n.trip.trainNo}-${n.trip.time}` === key,
          )
          return (
            <li
              key={key}
              className={
                nextKey.has(key) ? 'rail__row rail__row--next' : 'rail__row'
              }
            >
              <span className="rail__time">{trip.time}</span>
              <span className="rail__train">{trip.trainNo}</span>
              <span>
                {direction}
              </span>
              <span className="rail__eta">
                {upcoming
                  ? upcoming.inMin === 0
                    ? '지금'
                    : `${upcoming.inMin}분`
                  : ''}
              </span>
            </li>
          )
        })}
      </ul>
      <p className="rail__note">
        코레일 평일 시각표 · 주말·공휴일·지연은 미반영 · 현장/공지 우선
      </p>
        </>
      ) : null}
    </Panel>
  )
}
