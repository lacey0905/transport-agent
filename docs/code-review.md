# Transport Agent — 최종 코드 리뷰

작성일: 2026-08-12  
갱신: 2026-08-12 (개선 반영)  
대상: `transport-agent` (Vite + React + TypeScript)

## 요약

판교 출퇴근용 **개인용 모바일 SPA**.  
도메인 상수·최적 경로·실시간 버스·정적 경강선/셔틀이 한 화면에 묶여 있다.

**개인 사용 전제:** 보안(클라이언트 키·CORS 릴레이)과 단위 테스트는 의도적으로 다루지 않음.

| 영역 | 상태 |
|------|------|
| 아키텍처 | 컴포넌트 분리 완료 |
| 도메인 로직 | enabled · 도보겹침 · fetchedAt 보정 · 퇴근 전처리 |
| UI/UX | 대안 선택 · 지금 역 토글 · 주말 안내 · 히어로 정리 |
| 문서 | 본 파일 |

---

## 1. 시스템 개요

```
UI (App.tsx)
  ├─ components/*           Commute / Bus / Gyeonggang / Shuttle
  ├─ fetchWatchedArrivals() → api/bus.ts
  └─ findMorning/EveningOptimal → lib/optimalRoute.ts
        ├─ constants/commute.ts
        ├─ data/gyeonggang-weekday.ts
        └─ data/shuttle.ts
```

---

## 2. 개선 반영 현황

| ID | 내용 | 상태 |
|----|------|------|
| S1/S2 | 보안(키 노출·릴레이) | **스킵** (개인 사용) |
| L1 | 「지금 판교역」토글 | ✅ `atStation` 체크박스 |
| L2 | API 스냅샷 `fetchedAt`으로 예측분 보정 | ✅ |
| L3 | 주말 경강선 경고 | ✅ `isWeekend` + 배너 |
| L4 | 퇴근 출발표 1회 전처리 | ✅ |
| L5 | `hhmmToMin` 자정 경계 주석 | ✅ |
| U1 | `App.tsx` 컴포넌트 분리 | ✅ `src/components/*` |
| U2 | 대안 선택 키를 `mode`로 유지 | ✅ |
| U3 | 히어로 브랜드 중복 제거 | ✅ GNB만 `PANGYO` |
| U4 | 미사용 에셋 삭제 | ✅ |
| Q1 | 단위 테스트 | **스킵** (개인 사용) |
| Q2 | `package.json` name | ✅ `transport-agent` |
| Q3 | 한국어 에러 문구 | ✅ `formatBusError` |
| Q4 | 갱신 중첩 AbortController | ✅ |
| Q5 | `enabled` 플래그 존중 | ✅ |

---

## 3. 보안·비밀정보 (참고만)

개인용이므로 추가 조치 없음.  
로컬은 Vite 프록시, Pages는 `VITE_*` + allorigins 경로가 그대로 있을 수 있음.

- [x] `.env` / `docs/key.md` gitignore  
- [x] `.env.example`에 실키 없음  

---

## 4. 파일 맵

| 파일 | 역할 |
|------|------|
| `src/lib/optimalRoute.ts` | 추천 엔진 |
| `src/constants/commute.ts` | 현장 상수 |
| `src/api/bus.ts` | 버스 API · 에러 문구 · fetchedAt |
| `src/components/*` | UI 조각 |
| `src/data/shuttle.ts` | 셔틀 |
| `src/data/gyeonggang-weekday.ts` | 경강선 평일 · 주말 판별 |
| `vite.config.ts` | 로컬 프록시·키 가드 |

---

## 5. 결론

개인 출퇴근용으로 쓸 수 있는 상태.  
현장 수치는 `src/constants/commute.ts` / `docs/commute-constants.md`만 조정하면 된다.
