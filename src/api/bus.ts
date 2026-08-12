import { STATION_GROUPS, type StationGroup } from '../constants'

export type BusArrival = {
  routeId: number
  routeName: string
  predictTime1: number | null
  predictTime2: number | null
  locationNo1: number | null
  locationNo2: number | null
  /** 첫번째 차량 현재 위치 정류소명 */
  stationNm1: string | null
  /** 두번째 차량 현재 위치 정류소명 */
  stationNm2: string | null
  plateNo1: string | null
  plateNo2: string | null
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
  stationNm1?: string
  stationNm2?: string
  plateNo1?: string
  plateNo2?: string
  flag?: string
}

function toText(v: unknown): string | null {
  if (v === undefined || v === null) return null
  const s = String(v).trim()
  return s ? s : null
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
    stationNm1: toText(raw.stationNm1),
    stationNm2: toText(raw.stationNm2),
    plateNo1: toText(raw.plateNo1),
    plateNo2: toText(raw.plateNo2),
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

function encodeServiceKey(key: string): string {
  try {
    return encodeURIComponent(decodeURIComponent(key))
  } catch {
    return encodeURIComponent(key)
  }
}

/** 공공 API 원본 URL (Pages에서는 CORS 때문에 직접 호출 불가) */
function buildGovApiUrl(stationId: string): string | null {
  const key = (import.meta.env.VITE_DATA_GO_KR_KEY || '').trim()
  if (!key) return null
  const encodedKey = encodeServiceKey(key)
  return (
    `https://apis.data.go.kr/6410000/busarrivalservice/v2/getBusArrivalListv2` +
    `?serviceKey=${encodedKey}&stationId=${stationId}&format=json`
  )
}

async function fetchJson(
  url: string,
  signal?: AbortSignal,
): Promise<unknown> {
  const res = await fetch(url, { signal })
  if (res.status === 503) throw new Error('NO_API_KEY')
  if (!res.ok) throw new Error(`HTTP_${res.status}`)
  return res.json()
}

/**
 * Pages용: CORS 우회 프록시를 순서대로 시도.
 * allorigins /raw 는 github.io 에서 CORS 헤더 없이 실패하는 경우가 많음.
 */
async function fetchGovBusJson(
  stationId: string,
  signal?: AbortSignal,
): Promise<unknown> {
  if (import.meta.env.DEV) {
    return fetchJson(
      `/api/bus/busarrivalservice/v2/getBusArrivalListv2?stationId=${stationId}`,
      signal,
    )
  }

  const apiUrl = buildGovApiUrl(stationId)
  if (!apiUrl) throw new Error('NO_API_KEY')

  const encoded = encodeURIComponent(apiUrl)
  const attempts: Array<() => Promise<unknown>> = [
    () => fetchJson(`https://corsproxy.io/?${encoded}`, signal),
    async () => {
      const wrap = (await fetchJson(
        `https://api.allorigins.win/get?url=${encoded}`,
        signal,
      )) as { contents?: string }
      if (typeof wrap.contents !== 'string' || !wrap.contents) {
        throw new Error('PROXY_BAD')
      }
      return JSON.parse(wrap.contents) as unknown
    },
    () =>
      fetchJson(
        `https://api.codetabs.com/v1/proxy?quest=${encoded}`,
        signal,
      ),
  ]

  let last: unknown
  for (const attempt of attempts) {
    try {
      return await attempt()
    } catch (e) {
      if (
        signal?.aborted ||
        (e instanceof Error && e.message === 'ABORTED') ||
        (e instanceof DOMException && e.name === 'AbortError')
      ) {
        throw new Error('ABORTED')
      }
      last = e
    }
  }

  if (last instanceof Error) throw last
  throw new Error('PROXY_FAIL')
}

function parseArrivalResponse(data: unknown): {
  list: BusArrival[]
  error: string | null
} {
  const root = data as {
    response?: {
      msgHeader?: { resultCode?: number | string; resultMessage?: string }
      msgBody?: { busArrivalList?: RawArrival | RawArrival[] }
    }
  }
  const header = root?.response?.msgHeader
  const resultCode = Number(header?.resultCode)
  if (resultCode !== 0 && resultCode !== 4) {
    return {
      list: [],
      error: header?.resultMessage || `API_${resultCode}`,
    }
  }

  const list = asList<RawArrival>(root?.response?.msgBody?.busArrivalList).map(
    normalize,
  )
  return { list, error: null }
}

/** API/네트워크 코드를 짧은 한국어로 */
export function formatBusError(code: string): string {
  if (code === 'NO_API_KEY') {
    if (import.meta.env.DEV) {
      return '.env에 DATA_GO_KR_KEY를 넣고 개발 서버를 다시 켜 주세요.'
    }
    return '배포 빌드에 API 키가 없습니다. GitHub Actions에 DATA_GO_KR_KEY 시크릿을 넣고 다시 배포해 주세요.'
  }
  if (code === 'ABORTED') {
    return '요청이 취소됐어요.'
  }
  if (code === 'PROXY_FAIL' || code === 'PROXY_BAD') {
    return '버스 정보 우회 서버에 연결하지 못했어요. 잠시 후 다시 시도해 주세요.'
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
  try {
    const data = await fetchGovBusJson(stationId, signal)
    return parseArrivalResponse(data)
  } catch (e) {
    if (signal?.aborted || (e instanceof DOMException && e.name === 'AbortError')) {
      throw new Error('ABORTED')
    }
    if (e instanceof Error) {
      if (
        e.message === 'NO_API_KEY' ||
        e.message === 'ABORTED' ||
        e.message === 'PROXY_FAIL' ||
        e.message === 'PROXY_BAD' ||
        e.message.startsWith('HTTP_') ||
        e.message.startsWith('API_')
      ) {
        if (e.message === 'NO_API_KEY' || e.message === 'ABORTED') throw e
        return { list: [], error: e.message }
      }
    }
    return { list: [], error: 'PROXY_FAIL' }
  }
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
