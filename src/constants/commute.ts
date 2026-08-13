/**
 * 출퇴근 최적 경로 — 필수 상수
 * 값은 현장 기준으로 조정하세요.
 */

export type CommuteModeId = '380' | 'shuttle' | '602-2B'

/** 우선순위 숫자 작을수록 높음 */
export const MODE_PRIORITY: Record<CommuteModeId, number> = {
  '380': 1,
  shuttle: 2,
  '602-2B': 3, // 가장 낮음
}

export const COMMUTE = {
  /** 출근 — 값은 docs/essentials.md */
  morning: {
    /** 집 → 경강선 승강장 */
    homeToPlatformWalkMin: 10,
    /**
     * 판교역 하차 → 버스/셔틀 정류장
     * 다음 버스까지 이 시간 이상 남으면 대기와 겹쳐 도보를 차감한다.
     */
    subwayToBusWalkMin: 5,
    /** 버스/셔틀 → 네오위즈 (380·셔틀·602-2B 일괄) */
    busToOfficeMin: 10,
    modes: {
      '380': {
        id: '380' as const,
        label: '380',
        enabled: true,
        boardStationKey: 'pangyo-west' as const,
      },
      shuttle: {
        id: 'shuttle' as const,
        label: '셔틀',
        enabled: true,
        boardStationKey: null,
      },
      '602-2B': {
        id: '602-2B' as const,
        label: '602-2B',
        enabled: true,
        boardStationKey: 'pangyo-west' as const,
      },
    },
  },

  /** 퇴근 */
  evening: {
    /** 사무실 → 버스 정류장 */
    officeToBusWalkMin: 5,
    /** 출구 → 버스 정류장 */
    exitToBusWalkMin: 1,
    /** 셔틀·380 승차 후 판교역까지 */
    busToPangyoRideMin: 10,
    /**
     * 버스 하차 → 경강선 승강장
     * 다음 열차까지 (이 시간+여유) 이상 남으면 대기와 겹쳐 도보 시간을 차감한다.
     */
    busToSubwayWalkMin: 5,
    /** 지하철을 "온전히" 타기 위한 최소 여유(분) */
    subwayBoardBufferMin: 1,
    /** 퇴근 시 제외 */
    excludeModes: ['602-2B'] as CommuteModeId[],
    modes: {
      '380': {
        id: '380' as const,
        label: '380',
        enabled: true,
        boardStationKey: 'eco' as const,
      },
      shuttle: {
        id: 'shuttle' as const,
        label: '셔틀',
        enabled: true,
        boardStationKey: null,
      },
    },
  },
} as const

export const COMMUTE_LABEL = {
  morning: '출근',
  evening: '퇴근',
} as const

/** 이 시각(분) 미만은 출근(집·판교역), 이후는 퇴근만 */
export const COMMUTE_SPLIT_MIN = 15 * 60

export function isMorningWindow(now: Date): boolean {
  return now.getHours() * 60 + now.getMinutes() < COMMUTE_SPLIT_MIN
}
