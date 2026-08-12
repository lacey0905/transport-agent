import { useCallback, useEffect, useRef, useState } from 'react'
import { fetchWatchedArrivals, formatBusError, type StationGroupArrival } from './api/bus'
import { BusPanels } from './components/BusPanels'
import { CommutePanel } from './components/CommutePanel'
import { GyeonggangPanel } from './components/GyeonggangPanel'
import { Icon } from './components/Icon'
import { ShuttlePanel } from './components/ShuttlePanel'
import { REFRESH_MS } from './constants'
import { getShuttleSnapshot } from './data/shuttle'
import './App.css'

type Status = 'idle' | 'loading' | 'ready' | 'error'

export default function App() {
  const [status, setStatus] = useState<Status>('idle')
  const [stations, setStations] = useState<StationGroupArrival[]>([])
  const [error, setError] = useState<string | null>(null)
  const [updatedAt, setUpdatedAt] = useState<Date | null>(null)
  const [shuttle, setShuttle] = useState(() => getShuttleSnapshot())
  const [now, setNow] = useState(() => new Date())
  const [refreshing, setRefreshing] = useState(false)
  const abortRef = useRef<AbortController | null>(null)

  const load = useCallback(async () => {
    abortRef.current?.abort()
    const ac = new AbortController()
    abortRef.current = ac

    setStatus((prev) => (prev === 'ready' ? 'ready' : 'loading'))
    setRefreshing(true)
    setError(null)
    setNow(new Date())
    setShuttle(getShuttleSnapshot())

    try {
      const results = await fetchWatchedArrivals(ac.signal)
      if (ac.signal.aborted) return
      setStations(results)
      setUpdatedAt(new Date())
      setStatus('ready')
    } catch (e) {
      if (ac.signal.aborted) return
      const code = e instanceof Error ? e.message : 'UNKNOWN'
      if (code === 'ABORTED') return
      setError(formatBusError(code))
      setStatus('error')
    } finally {
      if (!ac.signal.aborted) setRefreshing(false)
    }
  }, [])

  useEffect(() => {
    void load()
    const id = window.setInterval(() => void load(), REFRESH_MS)
    return () => {
      window.clearInterval(id)
      abortRef.current?.abort()
    }
  }, [load])

  return (
    <div className="app">
      <header className="top">
        <p className="top__brand">PANGYO</p>
        <div className="top__meta">
          <p className="top__clock">
            <Icon name="schedule" />
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
            <Icon name="refresh" />
            새로고침
          </button>
        </div>
      </header>

      <section className="hero">
        <h1 className="hero__headline">지금 뭐 탈까?</h1>
        <p className="sub">출퇴근 최적 경로를 바로 보여 줘요</p>
      </section>

      {error ? (
        <p className="state state--error">
          <Icon name="error" filled />
          {error}
        </p>
      ) : null}

      <CommutePanel
        now={now}
        stations={stations}
        ready={status === 'ready'}
      />

      <BusPanels stations={stations} />
      <GyeonggangPanel now={now} />
      <ShuttlePanel shuttle={shuttle} />

      <footer className="foot">
        <p>
          <Icon name="sync" />
          {REFRESH_MS / 1000}초마다 자동 갱신
        </p>
      </footer>
    </div>
  )
}
