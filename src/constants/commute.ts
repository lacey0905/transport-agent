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
  /** 출근 */
  morning: {
    /**
     * 지하철(판교역) 하차 → 버스/셔틀 탑승 지점 도보
     * 다음 버스까지 이 시간 이상 남으면 대기와 겹쳐 도보 시간을 차감한다.
     */
    subwayToBusWalkMin: 5,
    modes: {
      '380': {
        id: '380' as const,
        label: '380',
        /** 판교역서편 → 회사 인근 승차시간 */
        rideMin: 8,
        /** 하차 후 회사까지 도보 */
        walkToOfficeMin: 5,
        /** 602-2B 대비 대략 유리한 시간(분) — 참고용 */
        fasterThan602bMin: 5,
        enabled: true,
        boardStationKey: 'pangyo-west' as const,
      },
      shuttle: {
        id: 'shuttle' as const,
        label: '셔틀',
        rideMin: 10,
        walkToOfficeMin: 8,
        enabled: true,
        boardStationKey: null,
      },
      '602-2B': {
        id: '602-2B' as const,
        label: '602-2B',
        rideMin: 8,
        walkToOfficeMin: 10,
        enabled: true,
        boardStationKey: 'pangyo-west' as const,
      },
    },
  },

  /** 퇴근 */
  evening: {
    /**
     * 사무실 → 버스/셔틀 탑승 지점 도보
     * 다음 버스까지 이 시간 이상 남으면 대기와 겹쳐 도보 시간을 차감한다.
     */
    officeToBusWalkMin: 5,
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
