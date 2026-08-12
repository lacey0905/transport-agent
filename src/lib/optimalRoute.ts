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

function pad(n: number): string {
  return String(n).padStart(2, '0')
}

export function formatClockFromMin(totalMin: number): string {
  const normalized = ((totalMin % (24 * 60)) + 24 * 60) % (24 * 60)
  const h = Math.floor(normalized / 60)
  const m = normalized % 60
  return `${pad(h)}:${pad(m)}`
}

function nowToMin(now: Date): number {
  return now.getHours() * 60 + now.getMinutes()
}

function hhmmToMin(hhmm: string): number {
  const [h, m] = hhmm.split(':').map(Number)
  const hour = h < 3 ? h + 24 : h
  return hour * 60 + m
}

function getBusBoardMinutes(
  stations: StationGroupArrival[],
  stationKey: 'pangyo-west' | 'eco',
  routeName: string,
  nowMin: number,
): number[] {
  const group = stations.find((s) => s.group.key === stationKey)
  const route = group?.routes.find((r) => r.routeName === routeName)
  const arrival = route?.arrival
  if (!arrival) return []

  const mins: number[] = []
  for (const p of [arrival.predictTime1, arrival.predictTime2]) {
    if (p === null) continue
    mins.push(nowMin + Math.max(0, p))
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

function walkDetail(originMin: number, busMin: number, walkMin: number): string {
  if (busMin - originMin >= walkMin) {
    return `버스까지 ${busMin - originMin}분 · 도보 ${walkMin}분 차감(대기와 겹침)`
  }
  return `버스까지 도보 ${walkMin}분`
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
 * 출근: 경강선 판교 도착 → 도보 → (380 / 셔틀 / 602-2B) → 회사
 */
export function findMorningOptimal(
  now: Date,
  stations: StationGroupArrival[],
): OptimalResult {
  const nowMin = nowToMin(now)
  const walk = COMMUTE.morning.subwayToBusWalkMin
  const modes = COMMUTE.morning.modes

  // 기준 시각: 지금 역에 있음 + 곧 도착하는 경강선 열차들
  const subwayArrivals = [
    nowMin,
    ...getNextTrips(PANGYO_ARRIVALS, now, 6).map((t) => nowMin + t.inMin),
  ]

  const options: RouteOption[] = []

  for (const subwayArriveMin of subwayArrivals) {
    const fromLabel =
      subwayArriveMin === nowMin
        ? '지금 판교역'
        : `경강선 도착 ${formatClockFromMin(subwayArriveMin)}`

    const pushBusOption = (
      mode: CommuteModeId,
      modeLabel: string,
      board: number,
      rideMin: number,
      walkToOfficeMin: number,
      boardPlace: string,
    ) => {
      if (!canCatchBus(subwayArriveMin, board, walk)) return
      const startWalk = walkStartMin(subwayArriveMin, board, walk)
      const office = board + rideMin + walkToOfficeMin
      options.push({
        mode,
        modeLabel,
        goalTime: formatClockFromMin(office),
        goalMin: office,
        priority: MODE_PRIORITY[mode],
        summary: `${fromLabel} → ${modeLabel} → 회사 ${formatClockFromMin(office)}`,
        catchable: true,
        legs: [
          { label: '경강선', at: formatClockFromMin(subwayArriveMin), detail: fromLabel },
          {
            label: '도보',
            at: formatClockFromMin(startWalk),
            detail: walkDetail(subwayArriveMin, board, walk),
          },
          {
            label: `${modeLabel} 탑승`,
            at: formatClockFromMin(board),
            detail: `${boardPlace} · 약 ${rideMin}분`,
          },
          {
            label: '회사 도착',
            at: formatClockFromMin(office),
            detail: `하차 후 도보 ${walkToOfficeMin}분`,
          },
        ],
      })
    }

    // 380
    {
      const m = modes['380']
      const boards = getBusBoardMinutes(stations, 'pangyo-west', '380', nowMin)
      for (const board of boards.slice(0, 3)) {
        pushBusOption('380', m.label, board, m.rideMin, m.walkToOfficeMin, '판교역서편')
      }
    }

    // 셔틀
    {
      const m = modes.shuttle
      const deps = getShuttleDepartures('출근', subwayArriveMin)
      for (const board of deps.slice(0, 3)) {
        pushBusOption('shuttle', m.label, board, m.rideMin, m.walkToOfficeMin, '셔틀 승차장')
      }
    }

    // 602-2B (우선순위 최저)
    {
      const m = modes['602-2B']
      const boards = getBusBoardMinutes(stations, 'pangyo-west', '602-2B', nowMin)
      for (const board of boards.slice(0, 3)) {
        pushBusOption(
          '602-2B',
          m.label,
          board,
          m.rideMin,
          m.walkToOfficeMin,
          '판교역서편',
        )
      }
    }
  }

  // 동일 mode+goal 중복 제거
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
  now: Date,
  stations: StationGroupArrival[],
): OptimalResult {
  const nowMin = nowToMin(now)
  const {
    officeToBusWalkMin,
    busToPangyoRideMin,
    busToSubwayWalkMin,
    subwayBoardBufferMin,
  } = COMMUTE.evening

  const options: RouteOption[] = []

  const tryMode = (
    mode: '380' | 'shuttle',
    boardTimes: number[],
    boardLabel: string,
  ) => {
    for (const board of boardTimes.slice(0, 3)) {
      // ① 사무실→버스: 다음 버스 ≥5분이면 도보 차감
      if (!canCatchBus(nowMin, board, officeToBusWalkMin)) continue

      const leaveOffice = walkStartMin(nowMin, board, officeToBusWalkMin)
      const pangyoArrive = board + busToPangyoRideMin

      // ② 버스→경강선: 다음 열차까지 (환승도보+여유) 이상이면 환승 도보 차감
      const transferNeed = busToSubwayWalkMin + subwayBoardBufferMin
      const trains = PANGYO_DEPARTURES.map((t) => ({
        trip: t,
        depMin: hhmmToMin(t.time),
      }))
        .filter((t) => canCatchBus(pangyoArrive, t.depMin, transferNeed))
        .sort((a, b) => a.depMin - b.depMin)

      const train = trains[0]
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

      // 열차 대기 ≥ 환승도보면 승강장으로 출발 시각을 늦춤
      const startTransfer = walkStartMin(
        pangyoArrive,
        train.depMin - subwayBoardBufferMin,
        busToSubwayWalkMin,
      )
      const platformAt = startTransfer + busToSubwayWalkMin

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
            label: '사무실 출발',
            at: formatClockFromMin(leaveOffice),
            detail: walkDetail(nowMin, board, officeToBusWalkMin),
          },
          {
            label: `${mode === '380' ? '380' : '셔틀'} 탑승`,
            at: formatClockFromMin(board),
            detail: boardLabel,
          },
          {
            label: '판교역 버스 하차',
            at: formatClockFromMin(pangyoArrive),
            detail: `이동 약 ${busToPangyoRideMin}분`,
          },
          {
            label: '경강선 승강장',
            at: formatClockFromMin(platformAt),
            detail: walkDetail(
              pangyoArrive,
              train.depMin - subwayBoardBufferMin,
              busToSubwayWalkMin,
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

  // 380 (생태학습원)
  const bus380 = getBusBoardMinutes(stations, 'eco', '380', nowMin)
  tryMode('380', bus380, '생태학습원')

  // 셔틀
  const shuttleDeps = getShuttleDepartures('퇴근', nowMin)
  tryMode('shuttle', shuttleDeps, '셔틀 승차장')

  const dedup = new Map<string, RouteOption>()
  for (const opt of options.filter((o) => o.catchable)) {
    const key = `${opt.mode}-${opt.goalMin}-${opt.legs[1]?.at}`
    const prev = dedup.get(key)
    if (!prev) dedup.set(key, opt)
  }

  // 퇴근 최적: 가장 빠른 경강선 열차 확보, 동일하면 380 우선
  return pickBest([...dedup.values()])
}

export function suggestCommutePeriod(now = new Date()): 'morning' | 'evening' {
  const min = nowToMin(now)
  // 04:00~14:59 출근, 그 외 퇴근 기본
  if (min >= 4 * 60 && min < 15 * 60) return 'morning'
  return 'evening'
}
