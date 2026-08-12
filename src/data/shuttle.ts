export type ShuttlePeriod = '출근' | '퇴근'

export type ShuttleSchedule = {
  period: ShuttlePeriod
  intervalMin: number
  count: number
  times: string[] // HH:mm
}

export const SHUTTLE = {
  travelMin: 10,
  travelNote: '교통 상황에 따라 ±2~3분',
  schedules: [
    {
      period: '출근',
      intervalMin: 15,
      count: 9,
      times: [
        '08:05',
        '08:20',
        '08:35',
        '08:50',
        '09:05',
        '09:20',
        '09:35',
        '09:50',
        '10:05',
      ],
    },
    {
      period: '퇴근',
      intervalMin: 20,
      count: 13,
      times: [
        '17:00',
        '17:20',
        '17:40',
        '18:00',
        '18:20',
        '18:40',
        '19:00',
        '19:20',
        '19:40',
        '20:00',
        '20:20',
        '20:40',
        '21:00',
      ],
    },
  ] as const satisfies readonly ShuttleSchedule[],
} as const

function toMinutes(hhmm: string): number {
  const [h, m] = hhmm.split(':').map(Number)
  return h * 60 + m
}

function formatClock(totalMin: number): string {
  const h = Math.floor(totalMin / 60) % 24
  const m = totalMin % 60
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
}

export type ShuttleSnapshot = {
  nowLabel: string
  active: ShuttleSchedule | null
  next: { period: ShuttlePeriod; time: string; inMin: number; index: number } | null
  upcoming: { period: ShuttlePeriod; time: string; inMin: number }[]
  etaMin: number | null
}

export function getShuttleSnapshot(now = new Date()): ShuttleSnapshot {
  const nowMin = now.getHours() * 60 + now.getMinutes()
  const nowLabel = formatClock(nowMin)

  const candidates: {
    period: ShuttlePeriod
    time: string
    inMin: number
    index: number
    dayOffset: number
  }[] = []

  for (const dayOffset of [0, 1]) {
    for (const schedule of SHUTTLE.schedules) {
      schedule.times.forEach((time, index) => {
        const abs = dayOffset * 24 * 60 + toMinutes(time)
        const inMin = abs - nowMin
        if (inMin >= 0) {
          candidates.push({
            period: schedule.period,
            time,
            inMin,
            index: index + 1,
            dayOffset,
          })
        }
      })
    }
  }

  candidates.sort((a, b) => a.inMin - b.inMin)
  const next = candidates[0]
    ? {
        period: candidates[0].period,
        time: candidates[0].time,
        inMin: candidates[0].inMin,
        index: candidates[0].index,
      }
    : null

  const upcoming = candidates.slice(0, 4).map(({ period, time, inMin }) => ({
    period,
    time,
    inMin,
  }))

  const active =
    SHUTTLE.schedules.find((s) => {
      const first = toMinutes(s.times[0])
      const last = toMinutes(s.times[s.times.length - 1])
      return nowMin >= first && nowMin <= last
    }) ?? null

  return {
    nowLabel,
    active,
    next,
    upcoming,
    etaMin: next ? next.inMin + SHUTTLE.travelMin : null,
  }
}
