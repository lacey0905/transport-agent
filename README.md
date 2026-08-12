# transport-agent

판교 출퇴근(버스·셔틀·경강선) 정보를 보여주는 React 앱입니다.

## 준비

1. [공공데이터포털 - 경기도 버스도착정보](https://www.data.go.kr/data/15080346/openapi.do) 활용신청 후 인증키 발급
2. `.env` 생성:

```env
DATA_GO_KR_KEY=발급받은_키
```

## 로컬 실행

```bash
npm install
npm run dev
```

API는 Vite 개발 서버 프록시(`/api/bus`)로 호출합니다.

## GitHub Pages 배포

`main` 푸시 시 Actions가 `dist`를 Pages에 배포합니다.

- URL: https://lacey0905.github.io/transport-agent/
- Settings → Pages → Source: **GitHub Actions**
- 실시간 버스를 Pages에서도 쓰려면 Repository secrets에 `DATA_GO_KR_KEY` 등록

```bash
gh secret set DATA_GO_KR_KEY --body "발급받은_키"
```

## 동작

- 정류소·노선별 실시간 도착 + 셔틀/경강선 시각표
- 20초마다 자동 갱신 + 수동 새로고침
