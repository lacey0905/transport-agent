import { STATION_GROUPS, type StationGroup } from '../constants'

export type BusArrival = {
  routeId: number
  routeName: string
  predictTime1: number | null
  predictTime2: number | null
  locationNo1: number | null
  locationNo2: number | null
  plateNo1: string | null
  plateNo2: string | null
  lowPlate1: boolean
  lowPlate2: boolean
  flag: string | null
}

export type RouteArrival = {
  routeName: string
  arrival: BusArrival | null
}

export type StationGroupArrival = {
  group: StationGroup
  routes: RouteArrival[]
  error: string | null
  /** 스냅샷 시각(ms). 경로 계산 시 예측분 보정에 사용 */
  fetchedAt: number
}

type RawArrival = {
  routeId?: number | string
  routeName?: string
  predictTime1?: number | string
  predictTime2?: number | string
  locationNo1?: number | string
  locationNo2?: number | string
  plateNo1?: string
  plateNo2?: string
  lowPlate1?: number | string
  lowPlate2?: number | string
  flag?: string
}

function toNum(v: unknown): number | null {
  if (v === undefined || v === null || v === '') return null
  const n = Number(v)
  return Number.isFinite(n) ? n : null
}

function asList<T>(value: T | T[] | undefined | null): T[] {
  if (!value) return []
  return Array.isArray(value) ? value : [value]
}

function normalize(raw: RawArrival): BusArrival {
  return {
    routeId: Number(raw.routeId) || 0,
    routeName: String(raw.routeName ?? ''),
    predictTime1: toNum(raw.predictTime1),
    predictTime2: toNum(raw.predictTime2),
    locationNo1: toNum(raw.locationNo1),
    locationNo2: toNum(raw.locationNo2),
    plateNo1: raw.plateNo1 ?? null,
    plateNo2: raw.plateNo2 ?? null,
    lowPlate1: String(raw.lowPlate1) === '1',
    lowPlate2: String(raw.lowPlate2) === '1',
    flag: raw.flag ?? null,
  }
}

function normalizeRouteName(name: string): string {
  return name.replace(/[()\s]/g, '').toUpperCase()
}

function matchesRoute(apiName: string, wanted: string): boolean {
  const a = normalizeRouteName(apiName)
  const w = normalizeRouteName(wanted)
  return a === w || a.startsWith(`${w}(`) || a.startsWith(w)
}

function buildArrivalUrl(stationId: string): string {
  if (import.meta.env.DEV) {
    return `/api/bus/busarrivalservice/v2/getBusArrivalListv2?stationId=${stationId}`
  }

  const key = (import.meta.env.VITE_DATA_GO_KR_KEY || '').trim()
  if (!key) {
    return ''
  }
  const encodedKey = encodeURIComponent(decodeURIComponent(key))
  const apiUrl =
    `https://apis.data.go.kr/6410000/busarrivalservice/v2/getBusArrivalListv2` +
    `?serviceKey=${encodedKey}&stationId=${stationId}&format=json`
  return `https://api.allorigins.win/raw?url=${encodeURIComponent(apiUrl)}`
}

/** API/네트워크 코드를 짧은 한국어로 */
export function formatBusError(code: string): string {
  if (code === 'NO_API_KEY') {
    return '.env에 DATA_GO_KR_KEY를 넣고 개발 서버를 다시 켜 주세요.'
  }
  if (code === 'ABORTED') {
    return '요청이 취소됐어요.'
  }
  if (code.startsWith('HTTP_')) {
    return '버스 서버에 연결하지 못했어요. 잠시 후 다시 시도해 주세요.'
  }
  if (code.startsWith('API_')) {
    return '버스 도착 정보를 가져오지 못했어요.'
  }
  return '버스 정보를 불러오지 못했어요.'
}

async function fetchStationArrivalList(
  stationId: string,
  signal?: AbortSignal,
): Promise<{
  list: BusArrival[]
  error: string | null
}> {
  const url = buildArrivalUrl(stationId)
  if (!url) {
    throw new Error('NO_API_KEY')
  }

  let res: Response
  try {
    res = await fetch(url, { signal })
  } catch (e) {
    if (signal?.aborted || (e instanceof DOMException && e.name === 'AbortError')) {
      throw new Error('ABORTED')
    }
    throw e
  }

  if (res.status === 503) {
    throw new Error('NO_API_KEY')
  }
  if (!res.ok) {
    return { list: [], error: `HTTP_${res.status}` }
  }

  const data = await res.json()
  const header = data?.response?.msgHeader
  const resultCode = Number(header?.resultCode)
  if (resultCode !== 0 && resultCode !== 4) {
    return {
      list: [],
      error: header?.resultMessage || `API_${resultCode}`,
    }
  }

  const list = asList<RawArrival>(data?.response?.msgBody?.busArrivalList).map(
    normalize,
  )
  return { list, error: null }
}

async function fetchGroupArrivals(
  group: StationGroup,
  signal?: AbortSignal,
): Promise<StationGroupArrival> {
  const fetchedAt = Date.now()
  const results = await Promise.all(
    group.stationIds.map((id) => fetchStationArrivalList(id, signal)),
  )

  const hardError = results.find((r) => r.error)?.error ?? null
  const merged = results.flatMap((r) => r.list)

  const routes: RouteArrival[] = group.routes.map((routeName) => {
    const arrival =
      merged.find((item) => matchesRoute(item.routeName, routeName)) ?? null
    return {
      routeName,
      arrival: arrival ? { ...arrival, routeName } : null,
    }
  })

  return {
    group,
    routes,
    error: merged.length === 0 && hardError ? hardError : null,
    fetchedAt,
  }
}

export async function fetchWatchedArrivals(
  signal?: AbortSignal,
): Promise<StationGroupArrival[]> {
  return Promise.all(
    STATION_GROUPS.map((group) => fetchGroupArrivals(group, signal)),
  )
}
