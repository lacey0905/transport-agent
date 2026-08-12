# 출퇴근 최적 경로 — 필수 상수

코드: `src/constants/commute.ts`

## 출근

| 상수 | 기본값 | 의미 |
|------|--------|------|
| `subwayToBusWalkMin` | 5분 | 경강선 하차 → 버스/셔틀. **다음 버스 ≥5분이면 도보 차감**(대기와 겹침) |
| `380.rideMin` | 8분 | 판교역서편 → 회사 인근 |
| `380.walkToOfficeMin` | 5분 | 하차 → 회사 |
| `shuttle.rideMin` | 10분 | 셔틀 이동 |
| `shuttle.walkToOfficeMin` | 8분 | 하차 → 회사 |
| `602-2B.rideMin` | 8분 | 판교역서편 → 회사 인근 |
| `602-2B.walkToOfficeMin` | 10분 | 하차 → 회사 |

우선순위: **380 > 셔틀 > 602-2B** (동일 도착이면 우선순위 높은 쪽)

## 퇴근

| 상수 | 기본값 | 의미 |
|------|--------|------|
| `officeToBusWalkMin` | 5분 | 사무실 → 버스/셔틀. **다음 버스 ≥5분이면 도보 차감**(대기와 겹침) · 출발 시각을 버스-5분으로 늦춤 |
| `busToPangyoRideMin` | 10분 | 380·셔틀 → 판교역 |
| `busToSubwayWalkMin` | 5분 | 버스 하차 → 경강선. **다음 열차 ≥ 도보(+여유)면 도보 차감** |
| `subwayBoardBufferMin` | 1분 | 온전 탑승 여유 |

- **602-2B 제외**
- 목표: 가장 빠른 경강선 열차를 여유 두고 탑승
