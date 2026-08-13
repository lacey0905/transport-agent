import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { fetchWatchedArrivals, formatBusError, type StationGroupArrival } from './api/bus'
import { BusPanels } from './components/BusPanels'
import { CommutePanel, type StartKind } from './components/CommutePanel'
import {
  applyClockOverride,
  DevClock,
  readDevAutoRefresh,
  writeDevAutoRefresh,
} from './components/DevClock'
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
  const [wallNow, setWallNow] = useState(() => new Date())
  const [clockOverride, setClockOverride] = useState<string | null>(null)
  const [autoRefresh, setAutoRefresh] = useState(() => readDevAutoRefresh())
  const [frozenAt, setFrozenAt] = useState<Date | null>(null)
  const [frozenKind, setFrozenKind] = useState<StartKind | null>(null)
  const liveNow = useMemo(
    () => applyClockOverride(clockOverride, wallNow),
    [clockOverride, wallNow],
  )
  const now = frozenAt ?? liveNow
  const [shuttle, setShuttle] = useState(() => getShuttleSnapshot(now))
  const [refreshing, setRefreshing] = useState(false)
  const abortRef = useRef<AbortController | null>(null)
  const clockOverrideRef = useRef(clockOverride)
  clockOverrideRef.current = clockOverride

  useEffect(() => {
    setShuttle(getShuttleSnapshot(now))
  }, [now])

  useEffect(() => {
    if (frozenAt) return
    const id = window.setInterval(() => setWallNow(new Date()), 1000)
    return () => window.clearInterval(id)
  }, [frozenAt])

  const load = useCallback(async (opts?: { silent?: boolean }) => {
    abortRef.current?.abort()
    const ac = new AbortController()
    abortRef.current = ac

    const clock = applyClockOverride(clockOverrideRef.current)
    setStatus((prev) => (prev === 'ready' ? 'ready' : 'loading'))
    if (!opts?.silent) setRefreshing(true)
    setError(null)
    setWallNow(new Date())
    setShuttle(getShuttleSnapshot(clock))

    try {
      const results = await fetchWatchedArrivals(ac.signal)
      if (ac.signal.aborted) return
      setStations(results)
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
    if (!autoRefresh) {
      return () => {
        abortRef.current?.abort()
      }
    }
    const id = window.setInterval(() => void load({ silent: true }), REFRESH_MS)
    return () => {
      window.clearInterval(id)
      abortRef.current?.abort()
    }
  }, [load, autoRefresh])

  const handleAutoRefresh = (on: boolean) => {
    writeDevAutoRefresh(on)
    setAutoRefresh(on)
  }

  const handleClockOverride = (hhmm: string | null) => {
    setClockOverride(hhmm)
    setFrozenAt(null)
    setFrozenKind(null)
  }

  const frozenHHmm = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`

  const setFrozenTime = (hhmm: string) => {
    const [h, m] = hhmm.split(':').map(Number)
    if (!Number.isFinite(h) || !Number.isFinite(m)) return
    const next = new Date(now)
    next.setHours(h, m, 0, 0)
    setFrozenAt(next)
  }

  return (
    <div className="app">
      <DevClock
        value={clockOverride}
        onChange={handleClockOverride}
        autoRefresh={autoRefresh}
        onAutoRefreshChange={handleAutoRefresh}
      />
      <header className="top">
        <p className="top__brand">PANGYO</p>
        <div className="top__meta">
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
        {frozenAt ? (
          <label className="hero__clock-edit">
            <span className="hero__headline hero__headline--clock">
              {now.toLocaleTimeString('ko-KR', {
                hour: '2-digit',
                minute: '2-digit',
              })}
            </span>
            <input
              type="time"
              value={frozenHHmm}
              onChange={(e) => {
                if (e.target.value) setFrozenTime(e.target.value)
              }}
              aria-label="출발 시각 변경"
            />
          </label>
        ) : (
          <h1 className="hero__headline hero__headline--clock">
            {now.toLocaleTimeString('ko-KR', {
              hour: '2-digit',
              minute: '2-digit',
              second: '2-digit',
            })}
          </h1>
        )}
        <p className="sub">
          {frozenKind === 'office' || frozenKind === 'exit'
            ? '이때 퇴근을 시작했어요 · 시각을 눌러 바꿀 수 있어요'
            : frozenKind
              ? '이때 출근을 시작했어요 · 시각을 눌러 바꿀 수 있어요'
              : '출발지를 누르면 시간이 잠깐 얼어요'}
        </p>
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
        refreshing={refreshing}
        activeKind={frozenKind}
        onFreeze={(kind) => {
          setFrozenAt(now)
          setFrozenKind(kind)
        }}
        onResume={() => {
          setFrozenAt(null)
          setFrozenKind(null)
        }}
      />

      <BusPanels stations={stations} refreshing={refreshing} />
      <GyeonggangPanel now={now} refreshing={refreshing} />
      <ShuttlePanel shuttle={shuttle} refreshing={refreshing} />

      <footer className="foot">
        <p>
          <Icon name="sync" />
          {autoRefresh
            ? `${REFRESH_MS / 1000}초마다 자동 갱신`
            : '자동 갱신 꺼짐 · 새로고침으로 불러와요'}
        </p>
      </footer>
    </div>
  )
}
