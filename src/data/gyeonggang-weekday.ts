/**
 * 판교역 경강선 평일 시간표
 * - 출발: 코레일 안내 기반 (2026.3 정리본)
 * - 도착: 여주→판교 평일 시각표의 판교 도착 (2025.4.14~) + 부발 시발 일부
 * 실제 운행은 코레일 공지/현장 시각표를 우선하세요.
 */

export type GyeonggangTrip = {
  time: string // HH:mm (판교 기준)
  trainNo: string
  terminal: string // 출발 시 종착 / 도착 시 시발
}

/** 판교 출발 (여주·부발 방면) */
export const PANGYO_DEPARTURES: GyeonggangTrip[] = [
  { time: '05:30', trainNo: 'K7501', terminal: '여주' },
  { time: '05:53', trainNo: 'K7503', terminal: '여주' },
  { time: '06:17', trainNo: 'K7505', terminal: '여주' },
  { time: '06:33', trainNo: 'K7507', terminal: '여주' },
  { time: '06:48', trainNo: 'K7509', terminal: '여주' },
  { time: '07:02', trainNo: 'K7511', terminal: '부발' },
  { time: '07:15', trainNo: 'K7513', terminal: '여주' },
  { time: '07:28', trainNo: 'K7515', terminal: '부발' },
  { time: '07:41', trainNo: 'K7517', terminal: '여주' },
  { time: '07:55', trainNo: 'K7519', terminal: '부발' },
  { time: '08:09', trainNo: 'K7521', terminal: '여주' },
  { time: '08:26', trainNo: 'K7523', terminal: '부발' },
  { time: '08:39', trainNo: 'K7525', terminal: '여주' },
  { time: '08:51', trainNo: 'K7527', terminal: '부발' },
  { time: '09:02', trainNo: 'K7529', terminal: '여주' },
  { time: '09:14', trainNo: 'K7531', terminal: '부발' },
  { time: '09:25', trainNo: 'K7533', terminal: '여주' },
  { time: '09:38', trainNo: 'K7535', terminal: '부발' },
  { time: '09:50', trainNo: 'K7537', terminal: '여주' },
  { time: '10:04', trainNo: 'K7539', terminal: '부발' },
  { time: '10:18', trainNo: 'K7541', terminal: '여주' },
  { time: '10:36', trainNo: 'K7543', terminal: '여주' },
  { time: '10:54', trainNo: 'K7545', terminal: '여주' },
  { time: '11:14', trainNo: 'K7547', terminal: '여주' },
  { time: '11:33', trainNo: 'K7549', terminal: '여주' },
  { time: '11:55', trainNo: 'K7551', terminal: '여주' },
  { time: '12:17', trainNo: 'K7553', terminal: '여주' },
  { time: '12:36', trainNo: 'K7555', terminal: '여주' },
  { time: '12:55', trainNo: 'K7557', terminal: '부발' },
  { time: '13:13', trainNo: 'K7559', terminal: '여주' },
  { time: '13:31', trainNo: 'K7561', terminal: '여주' },
  { time: '13:52', trainNo: 'K7563', terminal: '여주' },
  { time: '14:14', trainNo: 'K7565', terminal: '여주' },
  { time: '14:33', trainNo: 'K7567', terminal: '부발' },
  { time: '14:52', trainNo: 'K7569', terminal: '여주' },
  { time: '15:13', trainNo: 'K7571', terminal: '여주' },
  { time: '15:30', trainNo: 'K7573', terminal: '여주' },
  { time: '15:50', trainNo: 'K7575', terminal: '여주' },
  { time: '16:11', trainNo: 'K7577', terminal: '여주' },
  { time: '16:31', trainNo: 'K7579', terminal: '여주' },
  { time: '16:50', trainNo: 'K7581', terminal: '여주' },
  { time: '17:10', trainNo: 'K7583', terminal: '부발' },
  { time: '17:27', trainNo: 'K7585', terminal: '여주' },
  { time: '17:44', trainNo: 'K7587', terminal: '부발' },
  { time: '17:59', trainNo: 'K7589', terminal: '여주' },
  { time: '18:14', trainNo: 'K7591', terminal: '여주' },
  { time: '18:30', trainNo: 'K7593', terminal: '여주' },
  { time: '18:48', trainNo: 'K7595', terminal: '여주' },
  { time: '19:06', trainNo: 'K7597', terminal: '여주' },
  { time: '19:24', trainNo: 'K7599', terminal: '부발' },
  { time: '19:42', trainNo: 'K7601', terminal: '여주' },
  { time: '20:01', trainNo: 'K7603', terminal: '여주' },
  { time: '20:20', trainNo: 'K7605', terminal: '여주' },
  { time: '20:40', trainNo: 'K7607', terminal: '여주' },
  { time: '21:00', trainNo: 'K7609', terminal: '부발' },
  { time: '21:20', trainNo: 'K7611', terminal: '여주' },
  { time: '21:40', trainNo: 'K7613', terminal: '부발' },
  { time: '22:00', trainNo: 'K7615', terminal: '여주' },
  { time: '22:20', trainNo: 'K7617', terminal: '부발' },
  { time: '22:40', trainNo: 'K7619', terminal: '여주' },
  { time: '23:00', trainNo: 'K7621', terminal: '여주' },
  { time: '23:35', trainNo: 'K7623', terminal: '여주' },
]

/** 판교 도착 (여주·부발 방면 → 판교) */
export const PANGYO_ARRIVALS: GyeonggangTrip[] = [
  { time: '06:07', trainNo: 'K7502', terminal: '부발' },
  { time: '06:24', trainNo: 'K7504', terminal: '여주' },
  { time: '06:52', trainNo: 'K7508', terminal: '여주' },
  { time: '07:19', trainNo: 'K7512', terminal: '여주' },
  { time: '07:47', trainNo: 'K7516', terminal: '여주' },
  { time: '08:07', trainNo: 'K7520', terminal: '여주' },
  { time: '08:33', trainNo: 'K7524', terminal: '여주' },
  { time: '08:55', trainNo: 'K7528', terminal: '여주' },
  { time: '09:18', trainNo: 'K7530', terminal: '여주' },
  { time: '09:46', trainNo: 'K7532', terminal: '여주' },
  { time: '10:20', trainNo: 'K7536', terminal: '여주' },
  { time: '10:40', trainNo: 'K7538', terminal: '여주' },
  { time: '11:00', trainNo: 'K7540', terminal: '여주' },
  { time: '11:24', trainNo: 'K7542', terminal: '여주' },
  { time: '11:46', trainNo: 'K7544', terminal: '여주' },
  { time: '12:09', trainNo: 'K7546', terminal: '여주' },
  { time: '12:25', trainNo: 'K7548', terminal: '여주' },
  { time: '12:44', trainNo: 'K7550', terminal: '여주' },
  { time: '13:04', trainNo: 'K7552', terminal: '여주' },
  { time: '13:22', trainNo: 'K7554', terminal: '여주' },
  { time: '13:43', trainNo: 'K7556', terminal: '여주' },
  { time: '14:05', trainNo: 'K7558', terminal: '여주' },
  { time: '14:24', trainNo: 'K7560', terminal: '여주' },
  { time: '15:02', trainNo: 'K7564', terminal: '여주' },
  { time: '15:20', trainNo: 'K7566', terminal: '여주' },
  { time: '15:41', trainNo: 'K7568', terminal: '여주' },
  { time: '16:01', trainNo: 'K7570', terminal: '여주' },
  { time: '16:40', trainNo: 'K7574', terminal: '여주' },
  { time: '17:01', trainNo: 'K7576', terminal: '여주' },
  { time: '17:18', trainNo: 'K7578', terminal: '여주' },
  { time: '17:47', trainNo: 'K7582', terminal: '여주' },
  { time: '18:02', trainNo: 'K7584', terminal: '여주' },
  { time: '18:20', trainNo: 'K7586', terminal: '여주' },
  { time: '18:38', trainNo: 'K7588', terminal: '여주' },
  { time: '19:15', trainNo: 'K7592', terminal: '여주' },
  { time: '19:49', trainNo: 'K7596', terminal: '여주' },
  { time: '20:05', trainNo: 'K7598', terminal: '여주' },
  { time: '20:21', trainNo: 'K7600', terminal: '여주' },
  { time: '20:41', trainNo: 'K7602', terminal: '여주' },
  { time: '21:01', trainNo: 'K7604', terminal: '여주' },
  { time: '21:38', trainNo: 'K7608', terminal: '여주' },
  { time: '21:57', trainNo: 'K7610', terminal: '여주' },
  { time: '22:17', trainNo: 'K7612', terminal: '여주' },
  { time: '22:38', trainNo: 'K7614', terminal: '여주' },
  { time: '23:10', trainNo: 'K7616', terminal: '여주' },
  { time: '23:50', trainNo: 'K7618', terminal: '여주' },
  { time: '00:30', trainNo: 'K7620', terminal: '여주' },
]

function toMin(hhmm: string): number {
  const [h, m] = hhmm.split(':').map(Number)
  // 익일 00시대는 24+로 취급해 정렬
  const hour = h < 3 ? h + 24 : h
  return hour * 60 + m
}

/** 토·일 (공휴일은 미포함 — 현장 확인) */
export function isWeekend(now = new Date()): boolean {
  const day = now.getDay()
  return day === 0 || day === 6
}

export function getNextTrips(
  trips: GyeonggangTrip[],
  now = new Date(),
  count = 3,
): { trip: GyeonggangTrip; inMin: number }[] {
  const nowMin = now.getHours() * 60 + now.getMinutes()
  const upcoming = trips
    .map((trip) => {
      let inMin = toMin(trip.time) - nowMin
      if (inMin < 0) inMin += 24 * 60
      return { trip, inMin }
    })
    .sort((a, b) => a.inMin - b.inMin)
  return upcoming.slice(0, count)
}
