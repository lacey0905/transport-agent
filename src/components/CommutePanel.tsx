import { useEffect, useMemo, useState } from 'react'
import type { StationGroupArrival } from '../api/bus'
import { COMMUTE_LABEL } from '../constants/commute'
import {
  findEveningOptimal,
  findMorningOptimal,
  suggestCommutePeriod,
  type RouteOption,
} from '../lib/optimalRoute'
import { Icon } from './Icon'
import { modeBadgeClass, modeIcon } from './ui'

function pickByMode(
  options: RouteOption[],
  mode: string | null,
  fallback: RouteOption | null,
): RouteOption | null {
  if (!mode) return fallback
  return options.find((opt) => opt.mode === mode) ?? fallback
}

export function CommutePanel({
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
  const [selectedMode, setSelectedMode] = useState<string | null>(null)
  const [atStation, setAtStation] = useState(true)

  useEffect(() => {
    setPeriod(suggested)
  }, [suggested])

  useEffect(() => {
    setSelectedMode(null)
  }, [period])

  const result = useMemo(() => {
    if (period === 'morning') {
      return findMorningOptimal(now, stations, { atStation })
    }
    return findEveningOptimal(now, stations)
  }, [period, now, stations, atStation])

  const options = useMemo(() => {
    if (!result.best) return [] as RouteOption[]
    return [result.best, ...result.alternatives]
  }, [result])

  const selected = pickByMode(options, selectedMode, result.best)
  const alts = selected
    ? options.filter((opt) => opt !== selected).slice(0, 3)
    : []
  const isRecommended = Boolean(
    selected && result.best && selected === result.best,
  )

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

      {period === 'morning' ? (
        <label className="commute__toggle">
          <input
            type="checkbox"
            checked={atStation}
            onChange={(e) => setAtStation(e.target.checked)}
          />
          <span>지금 판교역에 있어요</span>
        </label>
      ) : null}

      {!ready && stations.length === 0 ? (
        <p className="state state--loading">경로 계산 중…</p>
      ) : null}

      {selected ? (
        <article className="commute__best">
          <div className="commute__best-top">
            <div className={`${modeBadgeClass(selected.mode)} badge--lg`}>
              <Icon name={modeIcon(selected.mode)} />
              {selected.modeLabel}
            </div>
            {isRecommended ? (
              <span className="badge badge--soft">
                <Icon name="star" filled />
                추천
              </span>
            ) : (
              <span className="badge badge--soft">선택됨</span>
            )}
          </div>
          <p className="commute__goal-label">
            <Icon name={period === 'morning' ? 'apartment' : 'train'} />
            {period === 'morning' ? '회사 도착' : '경강선 탑승'}
          </p>
          <p className="commute__goal">{selected.goalTime}</p>
          <p className="commute__summary">{selected.summary}</p>
          <ol className="commute__legs">
            {selected.legs.map((leg) => (
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
            {alts.map((opt) => {
              const recommended = opt.mode === result.best?.mode
              return (
                <li key={`${opt.mode}-${opt.goalMin}`}>
                  <button
                    type="button"
                    className="commute__alt"
                    onClick={() => setSelectedMode(opt.mode)}
                  >
                    <span className={modeBadgeClass(opt.mode)}>
                      <Icon name={modeIcon(opt.mode)} />
                      {opt.modeLabel}
                    </span>
                    <span className="commute__alt-text">
                      <strong>
                        {opt.goalTime}
                        {recommended ? ' · 추천' : ''}
                      </strong>
                      <em>{opt.summary}</em>
                    </span>
                    <Icon name="chevron_right" className="commute__alt-chevron" />
                  </button>
                </li>
              )
            })}
          </ul>
        </>
      ) : null}
    </section>
  )
}
