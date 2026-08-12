export type StationGroup = {
  key: string
  name: string
  /** 동일 명칭 정류소가 여러 개일 수 있음 (상·하행 등) */
  stationIds: string[]
  mobileNos: string[]
  routes: string[]
}

export const STATION_GROUPS: StationGroup[] = [
  {
    key: 'eco',
    name: '판교환경생태학습원',
    stationIds: ['206000127'],
    mobileNos: ['7804'],
    routes: ['380'],
  },
  {
    key: 'pangyo-west',
    name: '판교역서편',
    // 7407(시내버스) · 7455(마을버스 등) 둘 다 조회
    stationIds: ['206000681', '206000682'],
    mobileNos: ['7407', '7455'],
    routes: ['380', '602-2B'],
  },
]

export const REFRESH_MS = 20_000
