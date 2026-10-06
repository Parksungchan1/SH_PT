export interface Song {
  title: string
  artist: string
  /** "03:20" 형식 */
  playtime: string
  /** 앨범 커버 이미지 경로 */
  cover: string
  /** 커버 이미지 안에 곡명/아티스트 글자가 이미 들어있으면 true (앱에서 글자를 겹쳐 그리지 않음) */
  coverHasText?: boolean
}

export interface Artist {
  /** URL, 파일명에 쓰는 영문 id */
  id: string
  /** 카드에 표시되는 이름 */
  name: string
  /** 공연 정보 (예: "DAY 1 · 126 스테이지") */
  stage: string
  /** 카드 하단 태그 3개 */
  tags: string[]
  /** 카드 하단 "재생중..." 문구용 짧은 표기 (없으면 name 사용) */
  shortName?: string
  /** 아티스트 사진 */
  photo: string
  /** 대표곡 */
  mainSong: Song
  /** YouTube 공식 업로드 영상 id (v= 파라미터 값). 숨겨진 플레이어로 배경 음악처럼 재생 */
  youtubeVideoId: string
  /** 배경 재생 볼륨 (0~100). 영상마다 원본 마스터링 음량이 달라서 생기는 체감 음량 차이를 맞추는 용도 — 기본 100 */
  volumePercent?: number
  /** 유사곡 4곡 */
  similar: Song[]
  /** 영수증 키워드 (예: "여자 솔로 / 인디") */
  keywords: string
}
