# 출퇴근 상수 (코드)

현장 기준값·구간 설명은 **[essentials.md](./essentials.md)** 를 본다.

코드: `src/constants/commute.ts`

| 구간 (essentials) | 코드 필드 | 값 |
|-------------------|-----------|----|
| 집 → 경강선 승강장 10분 | `morning.homeToPlatformWalkMin` | 10 |
| 판교역 → 정류장 5분 | `morning.subwayToBusWalkMin` | 5 |
| 버스 → 네오위즈 10분 일괄 | `morning.busToOfficeMin` | 10 |
| 사무실 → 정류장 5분 | `evening.officeToBusWalkMin` | 5 |
| 출구 → 정류장 1분 | `evening.exitToBusWalkMin` | 1 |
| 버스 → 판교역 10분 일괄 | `evening.busToPangyoRideMin` | 10 |
| 판교역 → 승강장 5분 | `evening.busToSubwayWalkMin` | 5 |
| 온전 탑승 여유 | `evening.subwayBoardBufferMin` | 1 |
