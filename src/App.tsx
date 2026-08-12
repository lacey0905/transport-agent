import { useCallback, useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { fetchWatchedArrivals, type StationGroupArrival } from './api/bus'
import { REFRESH_MS } from './constants'
import { COMMUTE_LABEL } from './constants/commute'
import {
  getNextTrips,
  PANGYO_ARRIVALS,
  PANGYO_DEPARTURES,
  type GyeonggangTrip,
} from './data/gyeonggang-weekday'
import { getShuttleSnapshot, SHUTTLE, type ShuttleSnapshot } from './data/shuttle'
import {
  findEveningOptimal,
  findMorningOptimal,
  suggestCommutePeriod,
  type RouteOption,
} from './lib/optimalRoute'
import './App.css'

type Status = 'idle' | 'loading' | 'ready' | 'error'

function Icon({
  name,
  className = '',
  filled = false,
}: {
  name: string
  className?: string
  filled?: boolean
}) {
  return (
    <span
      className={`material-symbols-outlined${className ? ` ${className}` : ''}`}
      style={filled ? { fontVariationSettings: "'FILL' 1, 'wght' 500, 'GRAD' 0, 'opsz' 24" } : undefined}
      aria-hidden
    >
      {name}
    </span>
  )
}

function formatMinutes(min: number | null): string {
  if (min === null) return '—'
  if (min <= 0) return '도착'
  return `${min}분`
}

function modeBadgeClass(mode: string): string {
  if (mode === 'shuttle') return 'badge badge--shuttle'
  if (mode.includes('602')) return 'badge badge--village'
  if (mode === '380') return 'badge'
  return 'badge badge--rail'
}

function ArrivalSlot({
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

function Panel({
  icon,
  badgeClass,
  title,
  hint,
  children,
  defaultOpen = false,
}: {
  icon: string
  badgeClass?: string
  title: string
  hint: string
  children: ReactNode
  defaultOpen?: boolean
}) {
  return (
    <details className="panel" open={defaultOpen}>
      <summary className="panel__summary">
        <span className={`badge badge--icon ${badgeClass ?? 'badge'}`}>
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

function CommutePanel({
  now,
  stations,
  ready,
}: {
  now: Date
  stations: StationGroupArrival[]
  ready: boolean
}) {
  const suggested = suggestCommutePeriod(now)
  const [period, setPeriod] = useState<'morning' | 'evening'>(suggested)

  useEffect(() => {
    setPeriod(suggested)
  }, [suggested])

  const result = useMemo(() => {
    if (period === 'morning') return findMorningOptimal(now, stations)
    return findEveningOptimal(now, stations)
  }, [period, now, stations])

  const best = result.best
  const alts = result.alternatives.slice(0, 2)

  return (
    <section className="commute" aria-label="출퇴근 최적 경로">
      <div className="tabs" role="tablist" aria-label="출퇴근 전환">
        <button
          type="button"
          role="tab"
          aria-selected={period === 'morning'}
          className={`tab${period === 'morning' ? ' tab--on' : ''}`}
          onClick={() => setPeriod('morning')}
        >
          <Icon name="wb_sunny" className="tab__icon" />
          {COMMUTE_LABEL.morning}
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={period === 'evening'}
          className={`tab${period === 'evening' ? ' tab--on' : ''}`}
          onClick={() => setPeriod('evening')}
        >
          <Icon name="dark_mode" className="tab__icon" />
          {COMMUTE_LABEL.evening}
        </button>
      </div>

      {!ready && stations.length === 0 ? (
        <p className="state state--loading">경로 계산 중…</p>
      ) : null}

      {best ? (
        <article className="commute__best">
          <div className="commute__best-top">
            <div className={`${modeBadgeClass(best.mode)} badge--lg`}>
              {best.modeLabel}
            </div>
            <span className="badge badge--soft">추천</span>
          </div>
          <p className="commute__goal-label">
            {period === 'morning' ? '회사 도착' : '경강선 탑승'}
          </p>
          <p className="commute__goal">{best.goalTime}</p>
          <p className="commute__summary">{best.summary}</p>
          <ol className="commute__legs">
            {best.legs.map((leg) => (
              <li key={`${leg.label}-${leg.at}`}>
                <span className="commute__dot" aria-hidden />
                <span className="commute__leg-time">{leg.at}</span>
                <span className="commute__leg-body">
                  <strong>{leg.label}</strong>
                  {leg.detail ? <em>{leg.detail}</em> : null}
                </span>
              </li>
            ))}
          </ol>
        </article>
      ) : ready || stations.length > 0 ? (
        <p className="state">
          {period === 'morning'
            ? '지금 탈 수 있는 380·셔틀·602-2B 조합이 없어요. 아래 실시간·셔틀을 확인해 주세요.'
            : '경강선을 여유 있게 탈 수 있는 380·셔틀 경로가 없어요.'}
        </p>
      ) : null}

      {alts.length > 0 ? (
        <>
          <p className="commute__alts-title">다른 선택</p>
          <ul className="commute__alts">
            {alts.map((opt: RouteOption) => (
              <li key={`${opt.mode}-${opt.goalMin}-${opt.summary}`}>
                <span className={modeBadgeClass(opt.mode)}>{opt.modeLabel}</span>
                <span>{opt.summary}</span>
              </li>
            ))}
          </ul>
        </>
      ) : null}
    </section>
  )
}

function BusPanels({ stations }: { stations: StationGroupArrival[] }) {
  const liveHint = (item: StationGroupArrival) => {
    const first = item.routes.find((r) => r.arrival?.predictTime1 != null)
    if (!first?.arrival || first.arrival.predictTime1 === null) return '대기 없음'
    return `${first.routeName} ${formatMinutes(first.arrival.predictTime1)}`
  }

  return (
    <>
      {stations.map((item, index) => (
        <Panel
          key={item.group.key}
          icon="directions_bus"
          badgeClass="badge"
          title={item.group.name}
          hint={`실시간 · ${liveHint(item)}`}
          defaultOpen={index === 0}
        >
          {item.error ? (
            <p className="state state--error">조회 실패 ({item.error})</p>
          ) : null}

          {item.routes.map(({ routeName, arrival }) => (
            <div key={routeName} className="route-block">
              <div className="route-head">
                <span
                  className={
                    routeName.includes('602')
                      ? 'badge badge--village'
                      : 'badge'
                  }
                >
                  {routeName}
                </span>
                <p className="sub">도착 예정</p>
              </div>

              {!item.error && !arrival ? (
                <p className="state">도착 정보가 없습니다</p>
              ) : null}

              {arrival ? (
                <div className="board" aria-live="polite">
                  <ArrivalSlot
                    label="이번"
                    minutes={arrival.predictTime1}
                    stopsAway={arrival.locationNo1}
                    plate={arrival.plateNo1}
                    lowPlate={arrival.lowPlate1}
                  />
                  <ArrivalSlot
                    label="다음"
                    minutes={arrival.predictTime2}
                    stopsAway={arrival.locationNo2}
                    plate={arrival.plateNo2}
                    lowPlate={arrival.lowPlate2}
                  />
                </div>
              ) : null}
            </div>
          ))}
        </Panel>
      ))}
    </>
  )
}

function GyeonggangPanel({ now }: { now: Date }) {
  const [mode, setMode] = useState<'dep' | 'arr'>('dep')
  const trips = mode === 'dep' ? PANGYO_DEPARTURES : PANGYO_ARRIVALS
  const next = useMemo(() => getNextTrips(trips, now, 3), [trips, now])
  const nextKey = new Set(next.map((n) => `${n.trip.trainNo}-${n.trip.time}`))
  const hint = next[0]
    ? `다음 ${formatMinutes(next[0].inMin)} · ${next[0].trip.time}`
    : '평일 시간표'

  return (
    <Panel
      icon="train"
      badgeClass="badge badge--rail"
      title="판교역 경강선"
      hint={hint}
    >
      <div className="tabs" role="tablist" aria-label="출발 도착 전환">
        <button
          type="button"
          role="tab"
          aria-selected={mode === 'dep'}
          className={`tab tab--rail${mode === 'dep' ? ' tab--on' : ''}`}
          onClick={() => setMode('dep')}
        >
          출발 {PANGYO_DEPARTURES.length}
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={mode === 'arr'}
          className={`tab tab--rail${mode === 'arr' ? ' tab--on' : ''}`}
          onClick={() => setMode('arr')}
        >
          도착 {PANGYO_ARRIVALS.length}
        </button>
      </div>

      {next[0] ? (
        <article className="slot slot--urgent slot--rail">
          <p className="slot__label">
            다음 {mode === 'dep' ? '출발' : '도착'} · {next[0].trip.trainNo}
          </p>
          <p className="slot__time">{formatMinutes(next[0].inMin)}</p>
          <p className="slot__meta">
            {next[0].trip.time} ·{' '}
            {mode === 'dep'
              ? `${next[0].trip.terminal}행`
              : `${next[0].trip.terminal}발`}
          </p>
        </article>
      ) : null}

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
                {mode === 'dep' ? `${trip.terminal}행` : `${trip.terminal}발`}
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
      <p className="rail__note">코레일 평일 시각표 · 현장/공지 우선</p>
    </Panel>
  )
}

function ShuttlePanel({ shuttle }: { shuttle: ShuttleSnapshot }) {
  const next = shuttle.next
  const urgent = next !== null && next.inMin <= 5
  const hint = next
    ? `다음 ${formatMinutes(next.inMin)} · ${next.time}`
    : '운행 시간 외'

  return (
    <Panel
      icon="airport_shuttle"
      badgeClass="badge badge--shuttle"
      title="셔틀버스"
      hint={hint}
    >
      {next ? (
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
      ) : (
        <p className="state">예정된 셔틀이 없습니다</p>
      )}

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
    </Panel>
  )
}

export default function App() {
  const [status, setStatus] = useState<Status>('idle')
  const [stations, setStations] = useState<StationGroupArrival[]>([])
  const [error, setError] = useState<string | null>(null)
  const [updatedAt, setUpdatedAt] = useState<Date | null>(null)
  const [shuttle, setShuttle] = useState(() => getShuttleSnapshot())
  const [now, setNow] = useState(() => new Date())
  const [refreshing, setRefreshing] = useState(false)

  const load = useCallback(async () => {
    setStatus((prev) => (prev === 'ready' ? 'ready' : 'loading'))
    setRefreshing(true)
    setError(null)
    setNow(new Date())
    setShuttle(getShuttleSnapshot())
    try {
      const results = await fetchWatchedArrivals()
      setStations(results)
      setUpdatedAt(new Date())
      setStatus('ready')
    } catch (e) {
      const code = e instanceof Error ? e.message : 'UNKNOWN'
      if (code === 'NO_API_KEY') {
        setError(
          'DATA_GO_KR_KEY가 없습니다. .env에 인증키를 넣고 서버를 다시 켜세요.',
        )
      } else {
        setError(`조회 실패 (${code})`)
      }
      setStatus('error')
    } finally {
      setRefreshing(false)
    }
  }, [])

  useEffect(() => {
    void load()
    const id = window.setInterval(() => void load(), REFRESH_MS)
    return () => window.clearInterval(id)
  }, [load])

  return (
    <div className="app">
      <header className="top">
        <p className="top__brand">Pangyo</p>
        <div className="top__meta">
          <p className="top__clock">
            {now.toLocaleTimeString('ko-KR', {
              hour: '2-digit',
              minute: '2-digit',
            })}
            {updatedAt ? ` · 갱신됨` : ''}
          </p>
          <button
            type="button"
            className={`refresh${refreshing ? ' refresh--busy' : ''}`}
            onClick={() => void load()}
            aria-label="새로고침"
          >
            새로고침
          </button>
        </div>
      </header>

      <section className="hero">
        <h1 className="hero__brand">PANGYO</h1>
        <p className="hero__headline">지금 뭐 탈까?</p>
        <p className="sub">출퇴근 최적 경로를 바로 보여 줘요</p>
      </section>

      {error ? <p className="state state--error">{error}</p> : null}

      <CommutePanel
        now={now}
        stations={stations}
        ready={status === 'ready'}
      />

      <BusPanels stations={stations} />
      <GyeonggangPanel now={now} />
      <ShuttlePanel shuttle={shuttle} />

      <footer className="foot">
        <p>{REFRESH_MS / 1000}초마다 자동 갱신</p>
      </footer>
    </div>
  )
}
