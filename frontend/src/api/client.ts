/**
 * 백엔드 연동 지점.
 * 지금은 appConfig.useMock=true 로 목업 데이터를 돌려주며,
 * 백엔드가 준비되면 useMock=false 로 바꾸고 아래 fetch 구현만 서버 스펙에 맞춰 수정하면 됩니다.
 */
import { appConfig } from '../config/appConfig'
import { artists as mockArtists } from '../data/artists'
import type { Artist, Song } from '../data/types'

const base = appConfig.apiBaseUrl

const wait = (ms: number) => new Promise<void>((r) => setTimeout(r, ms))

async function http<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${base}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...init,
  })
  if (!res.ok) throw new Error(`API ${path} failed: ${res.status}`)
  return res.json() as Promise<T>
}

/** 서버가 돌려주는 상대경로(`/media/...`)를 절대 URL로 변환 */
const mediaUrl = (path: string) => (/^https?:\/\//.test(path) ? path : `${base}${path}`)

// --- 백엔드(@festival-nfc/shared) 응답 형태. 패키지가 분리돼 있어 여기서 그대로 옮겨 씀 ---
interface ApiSong {
  title: string
  artist: string
  playtime: string
  coverUrl: string
  coverHasText?: boolean
}
interface ApiArtist {
  id: string
  name: string
  shortName?: string
  stage: string
  tags: string[]
  imageUrl: string
  youtubeVideoId: string
  volumePercent?: number
  mainSong: ApiSong
  similarSongs: ApiSong[]
  keywords: string
}

function mapSong(s: ApiSong): Song {
  return { title: s.title, artist: s.artist, playtime: s.playtime, cover: mediaUrl(s.coverUrl), coverHasText: s.coverHasText }
}

function mapArtist(a: ApiArtist): Artist {
  return {
    id: a.id,
    name: a.name,
    shortName: a.shortName,
    stage: a.stage,
    tags: a.tags,
    photo: mediaUrl(a.imageUrl),
    mainSong: mapSong(a.mainSong),
    youtubeVideoId: a.youtubeVideoId,
    volumePercent: a.volumePercent ?? 100,
    similar: a.similarSongs.map(mapSong),
    keywords: a.keywords,
  }
}

/** 아티스트 9팀 + 유사곡 목록 */
export async function getArtists(): Promise<Artist[]> {
  if (appConfig.useMock) return mockArtists
  const artists = await http<ApiArtist[]>('/api/artists')
  return artists.map(mapArtist)
}

// --- 세션: NFC 태깅 후 앱이 처음 뜰 때 한 번 발급받아 재사용 (출력 요청에 필요) ---
let sessionId: string | null = null
let sessionPromise: Promise<string> | null = null

function ensureSession(): Promise<string> {
  if (sessionId) return Promise.resolve(sessionId)
  if (!sessionPromise) {
    sessionPromise = http<{ id: string }>('/api/session', { method: 'POST' })
      .then((s) => {
        sessionId = s.id
        return s.id
      })
      .catch((e) => {
        sessionPromise = null // 실패하면 다음 시도에서 재발급하도록
        throw e
      })
  }
  return sessionPromise
}

export interface PrintRequest {
  artistId: string
  /** 영수증에 찍히는 곡 목록 (대표곡 + 유사곡). 서버는 이미 완성된 결과지 이미지를 갖고 있어 이 필드는 안 쓰지만, 영수증 화면 렌더링에 씀 */
  songs: { title: string; artist: string; playtime: string }[]
  keywords: string
  totalPlaytime: string
}

interface PrintJob {
  id: string
  status: 'pending' | 'in_progress' | 'completed' | 'failed'
}

/** 출력 작업 상태를 짧은 간격으로 확인. admin-client가 실제로 프린터에 보낼 때까지 시간이 걸리므로 폴링함 */
async function pollPrintJob(jobId: string): Promise<void> {
  const start = Date.now()
  for (;;) {
    const job = await http<PrintJob>(`/api/print-jobs/${jobId}`)
    if (job.status === 'completed') return
    if (job.status === 'failed') throw new Error('출력에 실패했습니다')
    if (Date.now() - start > appConfig.printPollTimeoutMs) throw new Error('출력 확인 시간이 초과되었습니다')
    await wait(appConfig.printPollIntervalMs)
  }
}

/** 포토프린터 출력 요청. 완료되면 resolve, 실패하면 reject */
export async function requestPrint(payload: PrintRequest): Promise<void> {
  if (appConfig.useMock) {
    await wait(appConfig.mockPrintDelayMs)
    return
  }
  const sid = await ensureSession()
  const { jobId } = await http<{ jobId: string; queuePosition: number }>('/api/print-jobs', {
    method: 'POST',
    body: JSON.stringify({ sessionId: sid, artistId: payload.artistId }),
  })
  await pollPrintJob(jobId)
}

/** 결과 저장(서버 기록용). 백엔드에 아직 해당 엔드포인트가 없어 현재는 아무 동작도 하지 않음 */
export async function saveResult(_payload: PrintRequest): Promise<void> {
  return
}
