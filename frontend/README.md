# wavelog 프론트엔드

NFC 태깅 → 아티스트 추천 → 유사곡 결과 → 영수증 출력 흐름의 모바일 웹앱 (React + Vite + TypeScript).

## 실행

```bash
npm install
npm run dev        # http://localhost:5173  (--host 옵션으로 같은 Wi-Fi의 휴대폰에서도 접속 가능)
npm run build      # dist/ 생성
```

## 폴더 구조

```
src/
  config/appConfig.ts   동작 옵션 (터치 시작 여부, 안내 시간, 목업 사용, API 주소, 스와이프 등)
  data/artists.ts       아티스트 9팀 + 유사곡 목업 데이터 (Figma 기준)
  data/types.ts         데이터 타입
  api/client.ts         백엔드 연동 지점 (getArtists / requestPrint / saveResult)
  hooks/                오디오 플레이어, 아티스트 목록 로딩
  components/           Header, Logo, ArtistCard, Carousel, ResultContent, Receipt, 모달 2종
  pages/                Intro → ArtistSelect → Result → Printing → Done
  styles/global.css     디자인 토큰(색상/폰트/여백) + 공통 스타일
  assets/artists/<id>/  photo.jpg, album.jpg, sim1~4.jpg
public/audio/           대표곡 mp3 (파일명 = artists.ts 의 audioSrc)
```

## 백엔드 연동 방법

1. `src/config/appConfig.ts` 에서 `useMock: false`
2. `.env` 에 `VITE_API_BASE_URL` 설정
3. `src/api/client.ts` 의 fetch 경로/응답 형식을 서버 스펙에 맞게 수정

## 배포 (Railway)

백엔드(`https://github.com/Parksungchan1/-project`)와 함께 Railway에 배포되어 있음.
전체 절차(백엔드/프론트 서비스 생성, 환경변수, 트라이얼 관련 주의사항 포함)는 백엔드 저장소의
[`RAILWAY_DEPLOY.md`](https://github.com/Parksungchan1/-project/blob/main/RAILWAY_DEPLOY.md) 참고.
이 저장소만 따로 배포할 때 필요한 최소 정보:

- 빌드/시작: `npm run build` → `npm run preview -- --host 0.0.0.0 --port $PORT`
- 환경변수 `VITE_API_BASE_URL`에 백엔드 공개 URL을 넣어야 함 (빌드 전에 설정 — Vite는 빌드 시점에 값을 번들에 굽는다)

## 자동재생 관련

모바일 브라우저는 사용자 터치 전에는 소리 재생을 막습니다.
`appConfig.requireTapToStart=true` 이면 시작 화면 터치 시 오디오 잠금을 해제한 뒤 이동합니다.
터치 유도 화면 디자인이 나오면 `pages/IntroPage.tsx` 의 `.intro__tap` 부분을 교체하면 됩니다.
