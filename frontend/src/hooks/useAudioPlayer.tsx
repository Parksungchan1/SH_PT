import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'

/**
 * 앱 전체에서 하나의 YouTube 플레이어를 공유합니다 (화면엔 절대 안 보이게, 오디오만 재생).
 * - unlock(): 사용자 터치 이벤트 안에서 호출해 모바일 자동재생 잠금을 해제
 * - play(videoId): 카드가 바뀔 때 해당 아티스트의 대표곡(YouTube 공식 업로드)을 재생 (이전 곡은 정지)
 * - stop(): 정지
 */
interface AudioPlayer {
  unlocked: boolean
  currentSrc: string | null
  unlock: () => void
  play: (videoId: string) => void
  stop: () => void
}

/** 우리가 쓰는 부분만 최소로 선언한 YouTube IFrame Player API 타입 */
interface YTPlayer {
  loadVideoById: (videoId: string) => void
  stopVideo: () => void
  seekTo: (seconds: number, allowSeekAhead: boolean) => void
  destroy: () => void
}
interface YTPlayerEvent {
  data: number
}
const YT_STATE_ENDED = 0

const AudioContext = createContext<AudioPlayer | null>(null)

let apiLoadPromise: Promise<void> | null = null

/** YouTube IFrame Player API 스크립트를 앱 전체에서 한 번만 로드합니다. */
function loadYouTubeApi(): Promise<void> {
  if (apiLoadPromise) return apiLoadPromise
  apiLoadPromise = new Promise((resolve) => {
    const w = window as unknown as { YT?: { Player: unknown }; onYouTubeIframeAPIReady?: () => void }
    if (w.YT?.Player) {
      resolve()
      return
    }
    w.onYouTubeIframeAPIReady = () => resolve()
    const script = document.createElement('script')
    script.src = 'https://www.youtube.com/iframe_api'
    document.head.appendChild(script)
  })
  return apiLoadPromise
}

export function AudioProvider({ children }: { children: ReactNode }) {
  const playerRef = useRef<YTPlayer | null>(null)
  const pendingVideoIdRef = useRef<string | null>(null)
  const [unlocked, setUnlocked] = useState(false)
  const [currentSrc, setCurrentSrc] = useState<string | null>(null)

  useEffect(() => {
    let alive = true
    // YT.Player replaces its target element with an <iframe> on its own, so it must live in a
    // DOM node React never renders/diffs -- appended straight to <body>, outside React's tree
    // entirely. Handing it a React-rendered/ref'd node instead causes "insertBefore/removeChild:
    // not a child" crashes once React tries to reconcile a subtree YouTube already rewrote.
    const container = document.createElement('div')
    container.style.cssText = 'position:fixed;top:-9999px;left:-9999px;width:0;height:0;overflow:hidden;pointer-events:none'
    document.body.appendChild(container)
    const target = document.createElement('div')
    container.appendChild(target)

    loadYouTubeApi().then(() => {
      if (!alive) return
      const w = window as unknown as {
        YT: { Player: new (el: HTMLElement, opts: Record<string, unknown>) => YTPlayer }
      }
      playerRef.current = new w.YT.Player(target, {
        height: '0',
        width: '0',
        playerVars: { autoplay: 0, controls: 0, disablekb: 1, playsinline: 1 },
        events: {
          onReady: () => {
            if (pendingVideoIdRef.current) playerRef.current?.loadVideoById(pendingVideoIdRef.current)
          },
          // <audio loop> 대체: 끝까지 재생되면 처음부터 다시
          onStateChange: (e: YTPlayerEvent) => {
            if (e.data === YT_STATE_ENDED) {
              playerRef.current?.seekTo(0, true)
            }
          },
        },
      })
    })

    return () => {
      alive = false
      playerRef.current?.destroy()
      playerRef.current = null
      container.remove()
    }
  }, [])

  const unlock = useCallback(() => {
    setUnlocked(true)
  }, [])

  const play = useCallback((videoId: string) => {
    pendingVideoIdRef.current = videoId
    setCurrentSrc(videoId)
    // 플레이어가 아직 준비 안 됐으면 onReady 콜백이 대신 로드함
    playerRef.current?.loadVideoById(videoId)
  }, [])

  const stop = useCallback(() => {
    pendingVideoIdRef.current = null
    setCurrentSrc(null)
    playerRef.current?.stopVideo()
  }, [])

  const value = useMemo(() => ({ unlocked, currentSrc, unlock, play, stop }), [unlocked, currentSrc, unlock, play, stop])
  return <AudioContext.Provider value={value}>{children}</AudioContext.Provider>
}

export function useAudioPlayer() {
  const ctx = useContext(AudioContext)
  if (!ctx) throw new Error('useAudioPlayer must be used inside <AudioProvider>')
  return ctx
}
