import type { StationGroupArrival } from '../api/bus'
import {
  COMMUTE,
  MODE_PRIORITY,
  type CommuteModeId,
} from '../constants/commute'
import { getNextTrips, PANGYO_ARRIVALS, PANGYO_DEPARTURES } from '../data/gyeonggang-weekday'
import { SHUTTLE } from '../data/shuttle'

export type Leg = {
  label: string
  at: string
  detail?: string
}

export type RouteOption = {
  mode: CommuteModeId
  modeLabel: string
  /** 회사 도착(출근) 또는 열차 출발(퇴근) 시각 HH:mm */
  goalTime: string
  goalMin: number
  priority: number
  summary: string
  legs: Leg[]
  catchable: boolean
}

export type OptimalResult = {
  best: RouteOption | null
  alternatives: RouteOption[]
}

export type MorningOptions = {
  /** true면 출발 시각에 이미 판교역에 있는 것으로 본다 */
  atStation?: boolean
  /** 버스 예측 보정용 시계. 없으면 실제 현재 */
  clock?: Date
}

export type EveningOptions = {
  clock?: Date
  /** 정류장까지 도보. 없으면 사무실 기준 */
  toBusWalkMin?: number
  fromLabel?: string
}

function pad(n: number): string {
  return String(n).padStart(2, '0')
}

export function formatClockFromMin(totalMin: number): string {
  const rounded = Math.round(totalMin)
  const normalized = ((rounded % (24 * 60)) + 24 * 60) % (24 * 60)
  const h = Math.floor(normalized / 60)
  const m = normalized % 60
  return `${pad(h)}:${pad(m)}`
}

function nowToMin(now: Date): number {
  return now.getHours() * 60 + now.getMinutes()
}

/**
 * HH:mm → 분 단위.
 * 00:00~02:59는 익일(전날 심야 다이어)로 보고 +24h 한다.
 * 경강선 자정 전후 정렬·비교용.
 */
function hhmmToMin(hhmm: string): number {
  const [h, m] = hhmm.split(':').map(Number)
  const hour = h < 3 ? h + 24 : h
  return hour * 60 + m
}

/**
 * API 스냅샷의 예측분(분)을 fetchedAt·현재 시각 기준으로 보정한
 * 절대 탑승 시각. 출발 고정 시각(origin)과 분리한다.
 */
function getBusBoardMinutes(
  stations: StationGroupArrival[],
  stationKey: 'pangyo-west' | 'eco',
  routeName: string,
  clock: Date,
): number[] {
  const group = stations.find((s) => s.group.key === stationKey)
  const route = group?.routes.find((r) => r.routeName === routeName)
  const arrival = route?.arrival
  if (!arrival) return []

  const clockMin = nowToMin(clock)
  const fetchedAt = group?.fetchedAt ?? clock.getTime()
  const elapsedMin = Math.max(0, (clock.getTime() - fetchedAt) / 60_000)

  const mins: number[] = []
  for (const p of [arrival.predictTime1, arrival.predictTime2]) {
    if (p === null) continue
    const remaining = Math.max(0, Math.round(p - elapsedMin))
    mins.push(clockMin + remaining)
  }
  return mins
}

function getShuttleDepartures(period: '출근' | '퇴근', afterMin: number): number[] {
  const schedule = SHUTTLE.schedules.find((s) => s.period === period)
  if (!schedule) return []
  return schedule.times
    .map(hhmmToMin)
    .filter((t) => t >= afterMin)
    .sort((a, b) => a - b)
}

/**
 * 다음 버스까지 walkMin 이상 남았으면 도보 시간은 대기와 겹치므로 차감(실효 도보 0).
 * walkMin 미만이면 그 버스는 못 탐.
 */
function canCatchBus(
  originMin: number,
  busMin: number,
  walkMin: number,
): boolean {
  return busMin - originMin >= walkMin
}

/** 버스 대기 ≥ 도보시간 이면 출발을 (버스시각 - 도보)로 늦춤 */
function walkStartMin(
  originMin: number,
  busMin: number,
  walkMin: number,
): number {
  if (busMin - originMin >= walkMin) return busMin - walkMin
  return originMin
}

/** 도보 레그용 — 대기는 이전 구간(도착/하차)에 표시하고, 여기선 겹침만 안내 */
function walkDetail(
  originMin: number,
  targetMin: number,
  walkMin: number,
  destLabel = '버스',
): string {
  if (targetMin - originMin >= walkMin) {
    return `도보 ${walkMin}분 · ${destLabel} 대기와 겹침`
  }
  return `도보 ${walkMin}분 → ${destLabel}`
}

function pickBest(options: RouteOption[]): OptimalResult {
  const valid = options.filter((o) => o.catchable)
  valid.sort((a, b) => {
    if (a.goalMin !== b.goalMin) return a.goalMin - b.goalMin
    return a.priority - b.priority
  })
  return {
    best: valid[0] ?? null,
    alternatives: valid.slice(1),
  }
}

/**
 * 출근: (집 도보) → 경강선 판교 도착 → 도보 → (380 / 셔틀 / 602-2B) → 회사
 */
export function findMorningOptimal(
  origin: Date,
  stations: StationGroupArrival[],
  opts: MorningOptions = {},
): OptimalResult {
  const { atStation = true, clock = new Date() } = opts
  const originMin = nowToMin(origin)
  const homeWalk = COMMUTE.morning.homeToPlatformWalkMin
  const toBus = COMMUTE.morning.subwayToBusWalkMin
  const toOffice = COMMUTE.morning.busToOfficeMin
  const modes = COMMUTE.morning.modes

  const nextTrains = getNextTrips(PANGYO_ARRIVALS, origin, 8).map((t) => ({
    arriveMin: originMin + t.inMin,
    trip: t.trip,
  }))

  const subwaySlots = atStation
    ? [
        { arriveMin: originMin, trip: null as (typeof nextTrains)[0]['trip'] | null },
        ...nextTrains,
      ]
    : nextTrains.filter((s) => canCatchBus(originMin, s.arriveMin, homeWalk))

  const options: RouteOption[] = []

  for (const slot of subwaySlots) {
    const subwayArriveMin = slot.arriveMin
    const fromHome = !atStation
    const fromLabel =
      atStation && subwayArriveMin === originMin
        ? `출발 ${formatClockFromMin(originMin)} 판교역`
        : `경강선 판교 ${formatClockFromMin(subwayArriveMin)}`

    const pushBusOption = (
      mode: CommuteModeId,
      modeLabel: string,
      board: number,
      boardPlace: string,
    ) => {
      if (!canCatchBus(subwayArriveMin, board, toBus)) return
      const startWalk = walkStartMin(subwayArriveMin, board, toBus)
      const office = board + toOffice
      const waitToBus = Math.round(board - subwayArriveMin)
      const leaveHome = fromHome
        ? walkStartMin(originMin, subwayArriveMin, homeWalk)
        : originMin
      const platformAt = fromHome ? leaveHome + homeWalk : subwayArriveMin

      const homeLegs: Leg[] = fromHome
        ? [
            {
              label: '집 출발',
              at: formatClockFromMin(leaveHome),
              detail: walkDetail(originMin, subwayArriveMin, homeWalk, '열차'),
            },
            {
              label: '경강선 승강장',
              at: formatClockFromMin(platformAt),
              detail: slot.trip
                ? `${slot.trip.trainNo} · ${slot.trip.terminal}발`
                : `도보 ${homeWalk}분`,
            },
          ]
        : []

      options.push({
        mode,
        modeLabel,
        goalTime: formatClockFromMin(office),
        goalMin: office,
        priority: MODE_PRIORITY[mode],
        summary: fromHome
          ? `집 → 경강선 → ${modeLabel} → 회사 ${formatClockFromMin(office)}`
          : `${fromLabel} → ${modeLabel} → 회사 ${formatClockFromMin(office)}`,
        catchable: true,
        legs: [
          ...homeLegs,
          {
            label:
              atStation && subwayArriveMin === originMin
                ? '경강선'
                : '판교역 도착',
            at: formatClockFromMin(subwayArriveMin),
            detail:
              waitToBus > 0
                ? `${fromLabel} · 버스 ${waitToBus}분 후`
                : fromLabel,
          },
          {
            label: '도보',
            at: formatClockFromMin(startWalk),
            detail: walkDetail(subwayArriveMin, board, toBus),
          },
          {
            label: `${modeLabel} 탑승`,
            at: formatClockFromMin(board),
            detail: `${boardPlace} · ${toOffice}분`,
          },
          {
            label: '회사 도착',
            at: formatClockFromMin(office),
            detail: `버스 이동 ${toOffice}분`,
          },
        ],
      })
    }

    if (modes['380'].enabled) {
      const boards = getBusBoardMinutes(stations, 'pangyo-west', '380', clock)
      for (const board of boards.slice(0, 3)) {
        pushBusOption('380', modes['380'].label, board, '판교역서편')
      }
    }

    if (modes.shuttle.enabled) {
      const deps = getShuttleDepartures('출근', subwayArriveMin)
      for (const board of deps.slice(0, 3)) {
        pushBusOption('shuttle', modes.shuttle.label, board, '셔틀 승차장')
      }
    }

    if (modes['602-2B'].enabled) {
      const boards = getBusBoardMinutes(stations, 'pangyo-west', '602-2B', clock)
      for (const board of boards.slice(0, 3)) {
        pushBusOption('602-2B', modes['602-2B'].label, board, '판교역서편')
      }
    }
  }

  const dedup = new Map<string, RouteOption>()
  for (const opt of options) {
    const key = `${opt.mode}-${opt.goalMin}-${opt.legs[0]?.at}`
    const prev = dedup.get(key)
    if (!prev || opt.priority < prev.priority) dedup.set(key, opt)
  }

  return pickBest([...dedup.values()])
}

/**
 * 퇴근: 회사 → 도보 → (380 / 셔틀) → 판교역 → 도보 → 경강선(온전 탑승)
 * 602-2B 제외
 */
export function findEveningOptimal(
  origin: Date,
  stations: StationGroupArrival[],
  opts: EveningOptions = {},
): OptimalResult {
  const { clock = new Date(), fromLabel = '사무실' } = opts
  const originMin = nowToMin(origin)
  const {
    officeToBusWalkMin,
    busToPangyoRideMin,
    busToSubwayWalkMin,
    subwayBoardBufferMin,
    modes,
  } = COMMUTE.evening
  const toBusWalkMin = opts.toBusWalkMin ?? officeToBusWalkMin

  const options: RouteOption[] = []

  // 출발표 1회 전처리
  const departures = PANGYO_DEPARTURES.map((t) => ({
    trip: t,
    depMin: hhmmToMin(t.time),
  })).sort((a, b) => a.depMin - b.depMin)

  const tryMode = (
    mode: '380' | 'shuttle',
    boardTimes: number[],
    boardLabel: string,
  ) => {
    for (const board of boardTimes.slice(0, 3)) {
      if (!canCatchBus(originMin, board, toBusWalkMin)) continue

      const leaveOffice = walkStartMin(originMin, board, toBusWalkMin)
      const pangyoArrive = board + busToPangyoRideMin

      const transferNeed = busToSubwayWalkMin + subwayBoardBufferMin
      const train = departures.find((t) =>
        canCatchBus(pangyoArrive, t.depMin, transferNeed),
      )

      if (!train) {
        options.push({
          mode,
          modeLabel: mode === '380' ? '380' : '셔틀',
          goalTime: '—',
          goalMin: Number.POSITIVE_INFINITY,
          priority: MODE_PRIORITY[mode],
          summary: `${boardLabel} 후 탑승 가능한 경강선 없음`,
          catchable: false,
          legs: [],
        })
        continue
      }

      const trainReadyMin = train.depMin - subwayBoardBufferMin
      const startTransfer = walkStartMin(
        pangyoArrive,
        trainReadyMin,
        busToSubwayWalkMin,
      )
      const platformAt = startTransfer + busToSubwayWalkMin
      const waitToTrain = Math.round(trainReadyMin - pangyoArrive)

      options.push({
        mode,
        modeLabel: mode === '380' ? '380' : '셔틀',
        goalTime: train.trip.time,
        goalMin: train.depMin,
        priority: MODE_PRIORITY[mode],
        summary: `${boardLabel} → 경강선 ${train.trip.time} ${train.trip.terminal}행`,
        catchable: true,
        legs: [
          {
            label: `${fromLabel} 출발`,
            at: formatClockFromMin(leaveOffice),
            detail: walkDetail(originMin, board, toBusWalkMin),
          },
          {
            label: `${mode === '380' ? '380' : '셔틀'} 탑승`,
            at: formatClockFromMin(board),
            detail: boardLabel,
          },
          {
            label: '판교역 버스 하차',
            at: formatClockFromMin(pangyoArrive),
            detail:
              waitToTrain > 0
                ? `이동 약 ${busToPangyoRideMin}분 · 열차 ${waitToTrain}분 후`
                : `이동 약 ${busToPangyoRideMin}분`,
          },
          {
            label: '경강선 승강장',
            at: formatClockFromMin(platformAt),
            detail: walkDetail(
              pangyoArrive,
              trainReadyMin,
              busToSubwayWalkMin,
              '열차',
            ),
          },
          {
            label: '경강선 출발',
            at: train.trip.time,
            detail: `${train.trip.trainNo} · ${train.trip.terminal}행 · 여유 ${subwayBoardBufferMin}분`,
          },
        ],
      })
    }
  }

  if (modes['380'].enabled) {
    const bus380 = getBusBoardMinutes(stations, 'eco', '380', clock)
    tryMode('380', bus380, '생태학습원')
  }

  if (modes.shuttle.enabled) {
    const shuttleDeps = getShuttleDepartures('퇴근', originMin)
    tryMode('shuttle', shuttleDeps, '셔틀 승차장')
  }

  const dedup = new Map<string, RouteOption>()
  for (const opt of options.filter((o) => o.catchable)) {
    const key = `${opt.mode}-${opt.goalMin}-${opt.legs[1]?.at}`
    const prev = dedup.get(key)
    if (!prev) dedup.set(key, opt)
  }

  return pickBest([...dedup.values()])
}
