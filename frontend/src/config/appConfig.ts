/**
 * 앱 동작 설정. 디자인/기획 변경 시 이 파일만 수정하면 되도록 모아두었습니다.
 */
export const appConfig = {
  /** 시작 화면에서 "터치하여 시작"을 요구할지 여부.
   *  true  : 사용자가 화면을 한 번 터치해야 다음 화면으로 넘어감 (모바일 자동재생 잠금 해제용)
   *  false : 터치 없이 INTRO_DURATION_MS 후 자동으로 넘어감 (키오스크/전용 기기용) */
  requireTapToStart: true,

  /** 시작 안내 화면이 보이는 시간(ms). requireTapToStart=false 일 때 사용 */
  introDurationMs: 3000,

  /** 터치 후 안내 문구를 잠시 보여주는 시간(ms). 0이면 바로 이동 */
  introAfterTapMs: 1500,

  /** 백엔드 API 준비 전까지 목업 데이터/목업 출력 사용 */
  useMock: false,

  /** 목업 출력 시 "출력중" 화면을 유지하는 시간(ms) */
  mockPrintDelayMs: 2500,

  /** 백엔드 API 기본 주소 (useMock=false 일 때 사용) */
  apiBaseUrl: import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8080',

  /** 출력 작업 상태를 확인하는 폴링 간격(ms). admin-client가 실제로 프린터에 보낼 때까지 걸리는 시간 */
  printPollIntervalMs: 1000,

  /** 출력 상태 폴링을 포기하는 최대 시간(ms) */
  printPollTimeoutMs: 60_000,

  /** 카드 캐러셀: 손가락 스와이프 허용 여부 */
  enableSwipe: true,
} as const
