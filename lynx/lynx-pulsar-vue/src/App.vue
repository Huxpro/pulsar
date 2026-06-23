<script setup lang="ts">
import { ref, computed, onMounted } from 'vue-lynx'
import { Presets, Settings, createPatternComposer } from './pulsar'
import type { Pattern } from './pulsar'
import { ALL_PRESETS } from './presetData'
import type { PresetMeta } from './presetData'
import presetImages from './presetImages'
import './App.css'

// Tab bar icons (PNG, converted from PulsarApp SVGs)
import iconListActive from './assets/icons/list-active.png'
import iconListInactive from './assets/icons/list-inactive.png'
import iconBrushActive from './assets/icons/brush-active.png'
import iconBrushInactive from './assets/icons/brush-inactive.png'
import iconSparklesActive from './assets/icons/sparkles-active.png'
import iconSparklesInactive from './assets/icons/sparkles-inactive.png'

// ── Touch helpers ───────────────────────────────────────────────
// Lynx background-thread touch events can surface touches in a few shapes
// depending on version; read defensively to stay robust on device.
function firstTouch(e: any): any | null {
  return (
    e?.detail?.touches?.[0] ||
    e?.detail?.changedTouches?.[0] ||
    e?.touches?.[0] ||
    e?.changedTouches?.[0] ||
    null
  )
}
function pagePoint(e: any): { x: number; y: number } | null {
  const t = firstTouch(e)
  if (!t) return null
  return {
    x: t.pageX ?? t.clientX ?? t.x ?? 0,
    y: t.pageY ?? t.clientY ?? t.y ?? 0,
  }
}

const SOCKET_SERVER_URL = 'wss://pulsar-server.swmansion.com'

type ConnectionState =
  | 'DISCONNECTED'
  | 'CONNECTING'
  | 'CONNECTED_TO_SERVER'
  | 'FULLY_CONNECTED'
  | 'ERROR'

type ErrorType = 'INVALID_DATA' | 'CONNECTION_FAILED' | null

function playPattern(name: string): boolean {
  if (name.includes('System')) {
    const key = name.replace('System', '').replace('Preset', '')
    const normalizedKey = `${key.charAt(0).toLowerCase()}${key.slice(1)}`
    const systemPreset = (Presets.System as any)[normalizedKey] ?? (Presets.System as any)[key]
    if (typeof systemPreset === 'function') {
      systemPreset()
      return true
    }
    const androidPreset = (Presets.System.Android as any)?.[normalizedKey] ?? (Presets.System.Android as any)?.[key]
    if (typeof androidPreset === 'function') {
      androidPreset()
      return true
    }
    return false
  }
  const normalizedName = `${name.charAt(0).toLowerCase()}${name.slice(1)}`
  const preset = (Presets as any)[name] ?? (Presets as any)[normalizedName]
  if (typeof preset === 'function') {
    preset()
    return true
  }
  return false
}

// Home tab is hidden in the tab bar below: the "Connect device" pairing flow
// depends on WebSocket, which Lynx does not yet expose. Default to "presets"
// so the app opens straight onto the working surface.
const activeTab = ref<string>('presets')
const helpOpen = ref(false)

// ── Connection state ──
const connectionState = ref<ConnectionState>('DISCONNECTED')
const errorType = ref<ErrorType>(null)
const connectingCode = ref('')
const showPatternNotification = ref(false)
const patternFound = ref(false)
const patternName = ref('')

// Plain mutables — Vue's setup runs once, so no refs/effect-cleanup are needed.
let socket: any = null
let pingInterval: ReturnType<typeof setInterval> | null = null
let connectingTimeout: ReturnType<typeof setTimeout> | null = null
let patternNotificationTimeout: ReturnType<typeof setTimeout> | null = null
// WebSocket is background-thread-only and not yet available in Lynx; referenced
// loosely so the (currently unreachable) Home flow stays intact for re-enabling.
const WS: any = typeof (globalThis as any) !== 'undefined' ? (globalThis as any).WebSocket : undefined

function showPatternReceivedNotification(found: boolean, name: string) {
  if (patternNotificationTimeout) clearTimeout(patternNotificationTimeout)
  patternFound.value = found
  patternName.value = name
  showPatternNotification.value = true
  patternNotificationTimeout = setTimeout(() => {
    showPatternNotification.value = false
    patternNotificationTimeout = null
  }, 1000)
}

function handleOnConnect() {
  errorType.value = null
  if (pingInterval) {
    clearInterval(pingInterval)
    pingInterval = null
  }
  if (connectingTimeout) {
    clearTimeout(connectingTimeout)
    connectingTimeout = null
  }

  const code = connectingCode.value.trim()
  if (code.length === 0) return

  const query = `type=receiver&action=new_connection&code=${encodeURIComponent(code)}`
  const socketUrl = `${SOCKET_SERVER_URL}?${query}`

  if (socket) {
    socket.close()
    socket = null
  }

  const sock = new WS(socketUrl)
  socket = sock
  let hadError = false

  connectingTimeout = setTimeout(() => {
    if (socket === sock) {
      sock.close()
      connectionState.value = 'ERROR'
      errorType.value = 'CONNECTION_FAILED'
    }
  }, 15_000)

  connectionState.value = 'CONNECTING'

  sock.onopen = () => {
    if (connectingTimeout) {
      clearTimeout(connectingTimeout)
      connectingTimeout = null
    }
    connectionState.value = 'CONNECTED_TO_SERVER'
    pingInterval = setInterval(() => {
      if (socket?.readyState === WS.OPEN) {
        socket.send(JSON.stringify({ type: 'ping' }))
      }
    }, 25_000)
  }

  sock.onmessage = (event: any) => {
    const payload = typeof event.data === 'string' ? event.data : ''
    try {
      const json = JSON.parse(payload) as { type?: string; token?: string; message?: string }
      if (json.type === 'connection_established' || json.type === 'connection_restored') {
        connectionState.value = 'FULLY_CONNECTED'
        Presets.breakingWave()
      } else if (json.type === 'peer_disconnected') {
        connectionState.value = 'CONNECTED_TO_SERVER'
      } else if (json.type === 'pong') {
        // keepalive response — no-op
      } else if (json.type === 'broadcast') {
        if (json.message) {
          const found = playPattern(json.message)
          showPatternReceivedNotification(found, json.message)
        }
      }
    } catch {
      // parse error — ignore
    }
  }

  sock.onerror = () => {
    if (socket !== sock) return
    hadError = true
    connectionState.value = 'ERROR'
    errorType.value = 'CONNECTION_FAILED'
    Presets.chirp()
  }

  sock.onclose = (e: any) => {
    if (socket !== sock) return
    if (connectingTimeout) {
      clearTimeout(connectingTimeout)
      connectingTimeout = null
    }
    if (pingInterval) {
      clearInterval(pingInterval)
      pingInterval = null
    }
    if (e.code !== 1000 && !hadError) {
      connectionState.value = 'ERROR'
      errorType.value = 'INVALID_DATA'
      Presets.chirp()
    } else if (e.code === 1000) {
      connectionState.value = 'DISCONNECTED'
    }
  }
}

function handleDisconnect() {
  Presets.powerDown()
  socket?.close()
  socket = null
  if (pingInterval) {
    clearInterval(pingInterval)
    pingInterval = null
  }
  if (connectingTimeout) {
    clearTimeout(connectingTimeout)
    connectingTimeout = null
  }
  connectingCode.value = ''
  connectionState.value = 'DISCONNECTED'
  errorType.value = null
}

// Connection badge helpers
const connBadgeText = computed(() => {
  switch (connectionState.value) {
    case 'CONNECTING':
    case 'CONNECTED_TO_SERVER':
      return 'Waiting'
    case 'FULLY_CONNECTED':
      return 'Connected'
    default:
      return 'Not connected'
  }
})

const connDotColor = computed(() => {
  switch (connectionState.value) {
    case 'CONNECTING':
    case 'CONNECTED_TO_SERVER':
      return '#E1F3FA'
    case 'FULLY_CONNECTED':
      return '#57B495'
    default:
      return '#FF6259'
  }
})

const connSubtitleText = computed(() => {
  switch (connectionState.value) {
    case 'FULLY_CONNECTED':
      return 'Everything is ready, you can start testing the presets.'
    default:
      return 'Connect your haptic device first. Pair it with the app now so you can test the presets.'
  }
})

const infoBox = computed<{ text: string; color: string } | null>(() => {
  switch (connectionState.value) {
    case 'CONNECTING':
      return { text: 'Connecting to server...', color: '#001A72' }
    case 'CONNECTED_TO_SERVER':
      return { text: 'Waiting for browser connection...', color: '#ffac59' }
    case 'FULLY_CONNECTED':
      return { text: 'You are connected with the browser!', color: '#57B495' }
    case 'ERROR':
      return {
        text: errorType.value === 'INVALID_DATA' ? 'Invalid data. Please try again.' : 'Unable to connect with the server!',
        color: '#FF6259',
      }
    default:
      return null
  }
})

const showConnectForm = computed(() => connectionState.value === 'DISCONNECTED' || connectionState.value === 'ERROR')
const showDisconnectRow = computed(
  () =>
    connectionState.value === 'CONNECTING' ||
    connectionState.value === 'CONNECTED_TO_SERVER' ||
    connectionState.value === 'FULLY_CONNECTED',
)

function onConnectingInput(e: any) {
  connectingCode.value = e.detail.value || ''
}

// ── Presets state ──
const searchQuery = ref('')
const selectedTags = ref<string[]>([])
const supportLevel = ref('Unknown')

onMounted(() => {
  // Native module is background-thread-only and absent on the web preview; keep
  // the default "Unknown" rather than letting the call throw during mount.
  try {
    const level = Settings.getHapticsSupportLevel()
    const labels: Record<number, string> = { 0: 'None', 2: 'Limited', 3: 'Standard', 4: 'Advanced' }
    supportLevel.value = labels[level] || 'Unknown'
  } catch {
    supportLevel.value = 'Unknown'
  }
})

// Tag groups — AND across groups, OR within each group
const TAG_GROUPS: Record<string, string[]> = {
  Intensity: ['Gentle', 'Substantial', 'Bold'],
  Sharpness: ['Soft', 'Flexible', 'Rigid'],
  Shape: ['Peak', 'Impulses', 'Solid', 'Bumps', 'Saw', 'Pattern', 'Ramp'],
  Duration: ['Impulse', 'Short', 'Extended', 'Long'],
}

const filteredPresets = computed(() =>
  ALL_PRESETS.filter((p) => {
    const q = searchQuery.value.toLowerCase()
    const matchesSearch =
      !q ||
      p.name.toLowerCase().includes(q) ||
      p.description.toLowerCase().includes(q) ||
      p.tags.some((t) => t.toLowerCase().includes(q))

    let matchesTags = true
    if (selectedTags.value.length > 0) {
      const selectedByGroup: Record<string, string[]> = {}
      for (const tag of selectedTags.value) {
        for (const [group, members] of Object.entries(TAG_GROUPS)) {
          if (members.includes(tag)) {
            if (!selectedByGroup[group]) selectedByGroup[group] = []
            selectedByGroup[group].push(tag)
          }
        }
      }
      for (const group in selectedByGroup) {
        const tagsInGroup = selectedByGroup[group]
        if (!tagsInGroup.some((t) => p.tags.includes(t))) {
          matchesTags = false
          break
        }
      }
    }

    return matchesSearch && matchesTags
  }),
)

function onSearchInput(e: any) {
  searchQuery.value = e.detail.value || ''
}

function handleAddTag(tag: string) {
  if (!selectedTags.value.includes(tag)) selectedTags.value = [...selectedTags.value, tag]
}
function handleRemoveTag(tag: string) {
  selectedTags.value = selectedTags.value.filter((t) => t !== tag)
}
function handleClearTags() {
  selectedTags.value = []
}

// ── Preset playback with progress indicator ──
const playingPresetName = ref('')
const playProgress = ref(0) // 0-100
let playInterval: ReturnType<typeof setInterval> | null = null

function handlePlayPreset(preset: PresetMeta) {
  if (playingPresetName.value === preset.name) {
    if (playInterval) clearInterval(playInterval)
    playingPresetName.value = ''
    playProgress.value = 0
    return
  }
  if (playInterval) clearInterval(playInterval)

  preset.play()
  playingPresetName.value = preset.name
  playProgress.value = 0

  if (preset.duration > 0) {
    const startTime = Date.now()
    playInterval = setInterval(() => {
      const elapsed = Date.now() - startTime
      const pct = Math.min(100, (elapsed / preset.duration) * 100)
      playProgress.value = pct
      if (elapsed >= preset.duration) {
        if (playInterval) clearInterval(playInterval)
        playInterval = null
        playingPresetName.value = ''
        playProgress.value = 0
      }
    }, 16)
  } else {
    setTimeout(() => {
      playingPresetName.value = ''
      playProgress.value = 0
    }, 300)
  }
}

// ── Playground state ──
const pgIndicatorX = ref(-100)
const pgIndicatorY = ref(-100)
const pgRecording = ref(false)
const pgRecorded = ref(false)
const pgPlaying = ref(false)
const pgTimerText = ref('0.0s')
let pgTimer: ReturnType<typeof setInterval> | null = null
let pgStart = 0
let pgDuration = 0
let pgLastHaptic = 0
let pgEvents: Array<{ time: number; x: number; y: number; type: string }> = []
let pgPlayTimers: ReturnType<typeof setTimeout>[] = []

function handlePgTouchStart(e: any) {
  const pt = pagePoint(e)
  if (!pt) return
  const x = pt.x - 35
  const y = pt.y - 200
  pgIndicatorX.value = x
  pgIndicatorY.value = y
  Presets.System.impactLight()
  pgLastHaptic = Date.now()
  if (pgRecording.value) {
    pgEvents.push({ time: Date.now() - pgStart, x, y, type: 'tap' })
  }
}

function handlePgTouchMove(e: any) {
  const pt = pagePoint(e)
  if (!pt) return
  const x = pt.x - 35
  const y = pt.y - 200
  pgIndicatorX.value = x
  pgIndicatorY.value = y
  const now = Date.now()
  if (now - pgLastHaptic > 80) {
    Presets.System.selection()
    pgLastHaptic = now
    if (pgRecording.value) {
      pgEvents.push({ time: now - pgStart, x, y, type: 'move' })
    }
  }
}

function handlePgTouchEnd() {
  pgIndicatorX.value = -100
  pgIndicatorY.value = -100
}

function handlePgRecord() {
  if (pgRecording.value) {
    pgRecording.value = false
    pgRecorded.value = true
    pgDuration = Date.now() - pgStart
    if (pgTimer) clearInterval(pgTimer)
    pgTimer = null
  } else {
    pgRecording.value = true
    pgRecorded.value = false
    pgPlaying.value = false
    pgEvents = []
    pgStart = Date.now()
    pgTimerText.value = '0.0s'
    pgTimer = setInterval(() => {
      const elapsed = (Date.now() - pgStart) / 1000
      pgTimerText.value = elapsed.toFixed(1) + 's'
    }, 100)
  }
}

function handlePgPlay() {
  if (!pgRecorded.value || pgPlaying.value) return
  if (pgEvents.length === 0) return
  pgPlaying.value = true
  const totalSec = (pgDuration / 1000).toFixed(1)
  const playStart = Date.now()

  const timers: ReturnType<typeof setTimeout>[] = []
  for (const evt of pgEvents) {
    const t = setTimeout(() => {
      pgIndicatorX.value = evt.x
      pgIndicatorY.value = evt.y
      if (evt.type === 'tap') {
        Presets.System.impactLight()
      } else {
        Presets.System.selection()
      }
    }, evt.time)
    timers.push(t)
  }
  const endTimer = setTimeout(() => {
    pgIndicatorX.value = -100
    pgIndicatorY.value = -100
  }, pgDuration)
  timers.push(endTimer)
  pgPlayTimers = timers

  const interval = setInterval(() => {
    const elapsedSec = ((Date.now() - playStart) / 1000).toFixed(1)
    pgTimerText.value = elapsedSec + 's / ' + totalSec + 's'
    if (Date.now() - playStart >= pgDuration) {
      clearInterval(interval)
      pgPlaying.value = false
      pgTimerText.value = totalSec + 's'
    }
  }, 100)
}

const pgTimerLabel = computed(() =>
  pgPlaying.value ? 'Playing' : pgRecording.value ? 'Recording' : pgRecorded.value ? 'Duration' : 'Ready',
)

// ── Demos state ──
const activeDemo = ref('')
const DEMO_LIST = [
  { id: 'slider', title: 'Slider' },
  { id: 'buttons', title: 'Buttons' },
  { id: 'countdown', title: 'Countdown timer' },
  { id: 'balloon', title: 'Balloon' },
  { id: 'dotloader', title: 'Dot Loader' },
  { id: 'notification', title: 'Notification' },
  { id: 'sensor', title: 'Sensor Haptics' },
]
function selectDemo(id: string) {
  activeDemo.value = id
}
function handleBackToMenu() {
  activeDemo.value = ''
}

// ── Button press animation state ──
const pressedBtn = ref('')
function handleDemoBtnPress(id: string, play: () => void) {
  play()
  pressedBtn.value = id
  setTimeout(() => (pressedBtn.value = ''), 200)
}

// ── Sensor demo state (touch-based fallback — no accelerometer API in Lynx) ──
const sensorDotX = ref(128)
const sensorDotY = ref(128)
let sensorLastHaptic = 0
const CIRCLE_R = 140
const DOT_R = 12
const CIRCLE_CX = 140
const CIRCLE_CY = 140

function handleSensorTouch(e: any) {
  const t = firstTouch(e)
  if (!t) return
  const localX = t.offsetX !== undefined ? t.offsetX : (t.pageX ?? t.clientX ?? 0) - 50
  const localY = t.offsetY !== undefined ? t.offsetY : (t.pageY ?? t.clientY ?? 0) - 300

  const dx = localX - CIRCLE_CX
  const dy = localY - CIRCLE_CY
  const dist = Math.sqrt(dx * dx + dy * dy)
  const maxDist = CIRCLE_R - DOT_R

  let finalX = localX - DOT_R
  let finalY = localY - DOT_R

  if (dist > maxDist) {
    const scale = maxDist / dist
    finalX = CIRCLE_CX + dx * scale - DOT_R
    finalY = CIRCLE_CY + dy * scale - DOT_R
    const now = Date.now()
    if (now - sensorLastHaptic > 150) {
      Presets.System.impactMedium()
      sensorLastHaptic = now
    }
  } else {
    const now = Date.now()
    if (now - sensorLastHaptic > 100) {
      Presets.System.selection()
      sensorLastHaptic = now
    }
  }

  sensorDotX.value = finalX
  sensorDotY.value = finalY
}

// ── Balloon demo state ──
const balloonProgress = ref([0, 0, 0, 0])
const balloonPopped = ref([false, false, false, false])
const balloonIntervals: (ReturnType<typeof setInterval> | null)[] = [null, null, null, null]

function balloonStart(index: number) {
  if (balloonPopped.value[index]) return
  const interval = setInterval(() => {
    const next = [...balloonProgress.value]
    next[index] = Math.min(1, next[index] + 0.02)

    if (next[index] < 0.5) {
      Presets.System.selection()
    } else if (next[index] < 0.9) {
      Presets.System.impactLight()
    } else if (next[index] < 1) {
      Presets.System.impactMedium()
    }

    if (next[index] >= 1) {
      Presets.System.impactHeavy()
      clearInterval(interval)
      balloonIntervals[index] = null
      const popped = [...balloonPopped.value]
      popped[index] = true
      balloonPopped.value = popped
      setTimeout(() => {
        const p = [...balloonPopped.value]
        p[index] = false
        balloonPopped.value = p
        const pr = [...balloonProgress.value]
        pr[index] = 0
        balloonProgress.value = pr
      }, 1500)
    }

    balloonProgress.value = next
  }, 50)
  balloonIntervals[index] = interval
}

function balloonEnd(index: number) {
  if (balloonIntervals[index]) {
    clearInterval(balloonIntervals[index]!)
    balloonIntervals[index] = null
  }
  if (!balloonPopped.value[index]) {
    const deflate = setInterval(() => {
      const next = [...balloonProgress.value]
      next[index] = Math.max(0, next[index] - 0.03)
      if (next[index] <= 0) clearInterval(deflate)
      balloonProgress.value = next
    }, 50)
  }
}

// ── Slider demo state ──
const slider1 = ref(50)
const slider2 = ref(50)
const slider3 = ref(50)
let slider1Tick = 5
let slider2Tick = 5
let slider3Tick = 5
const sliderTracks: Record<number, { left: number; width: number }> = {
  1: { left: 0, width: 300 },
  2: { left: 0, width: 300 },
  3: { left: 0, width: 300 },
}

const quickTickPattern: Pattern = { discretePattern: [{ time: 0, amplitude: 1, frequency: 1 }, { time: 40, amplitude: 0, frequency: 1 }], continuousPattern: { amplitude: [], frequency: [] } }
const softTickPattern: Pattern = { discretePattern: [{ time: 0, amplitude: 0.6, frequency: 0.4 }, { time: 60, amplitude: 0, frequency: 0.4 }], continuousPattern: { amplitude: [], frequency: [] } }
const deepTickPattern: Pattern = { discretePattern: [{ time: 0, amplitude: 0.8, frequency: 0.2 }, { time: 80, amplitude: 0, frequency: 0.2 }], continuousPattern: { amplitude: [], frequency: [] } }

const quickTickComposer = createPatternComposer()
const softTickComposer = createPatternComposer()
const deepTickComposer = createPatternComposer()

const THUMB_SIZE = 30
const TRACK_PADDING = 5

function handleSliderLayout(sliderNum: number, e: any) {
  const layout = e?.detail || e
  if (layout && layout.width) {
    sliderTracks[sliderNum] = { left: layout.x || 0, width: layout.width }
  }
}

function thumbLeft(pct: number, sliderNum: number): string {
  const track = sliderTracks[sliderNum]
  if (!track || !track.width) return pct + '%'
  const trackInner = track.width - TRACK_PADDING * 2
  const px = TRACK_PADDING + (pct / 100) * (trackInner - THUMB_SIZE)
  return px + 'px'
}

function handleSliderMove(sliderNum: number, e: any) {
  const t = firstTouch(e)
  if (!t) return
  const track = sliderTracks[sliderNum]
  if (!track || !track.width) return
  const trackInner = track.width - TRACK_PADDING * 2
  const localX = (t.offsetX !== undefined ? t.offsetX : (t.pageX ?? t.clientX ?? 0) - track.left) - TRACK_PADDING
  const raw = (localX / trackInner) * 100
  const pct = Math.max(0, Math.min(100, Math.round(raw)))
  const tick = Math.floor(pct / 10)

  if (sliderNum === 1) {
    slider1.value = pct
    if (tick !== slider1Tick) {
      slider1Tick = tick
      quickTickComposer.play()
    }
  } else if (sliderNum === 2) {
    slider2.value = pct
    if (tick !== slider2Tick) {
      slider2Tick = tick
      softTickComposer.play()
    }
  } else {
    slider3.value = pct
    if (tick !== slider3Tick) {
      slider3Tick = tick
      deepTickComposer.play()
    }
  }
}

// ── Dot Loader demo state ──
const dotPattern1: Pattern = { discretePattern: [{ time: 0, amplitude: 0.8, frequency: 0.9 }, { time: 40, amplitude: 0, frequency: 0.9 }], continuousPattern: { amplitude: [], frequency: [] } }
const dotPattern2: Pattern = { discretePattern: [{ time: 0, amplitude: 0.6, frequency: 0.6 }, { time: 50, amplitude: 0, frequency: 0.6 }], continuousPattern: { amplitude: [], frequency: [] } }
const dotPattern3: Pattern = { discretePattern: [{ time: 0, amplitude: 0.7, frequency: 0.8 }, { time: 45, amplitude: 0, frequency: 0.8 }], continuousPattern: { amplitude: [], frequency: [] } }

const dotComposer1 = createPatternComposer()
const dotComposer2 = createPatternComposer()
const dotComposer3 = createPatternComposer()

const CYCLE = 1500
const DOT_DELAY = 220
const BOTTOM_HIT_RATIO = 0.21

let dotLoaderActive = false
const dotTimeouts: ReturnType<typeof setTimeout>[] = []
const dotIntervals: ReturnType<typeof setInterval>[] = []

function stopDotLoader() {
  dotTimeouts.forEach((t) => clearTimeout(t))
  dotIntervals.forEach((t) => clearInterval(t))
  dotTimeouts.length = 0
  dotIntervals.length = 0
  dotLoaderActive = false
}

function startDotLoader() {
  if (dotLoaderActive) return
  dotLoaderActive = true
  const composers = [dotComposer1, dotComposer2, dotComposer3]
  composers.forEach((composer, i) => {
    const firstHit = i * DOT_DELAY + CYCLE * BOTTOM_HIT_RATIO
    const t = setTimeout(() => {
      composer.play()
      const interval = setInterval(() => composer.play(), CYCLE)
      dotIntervals.push(interval)
    }, firstHit)
    dotTimeouts.push(t)
  })
}

// ── Notification demo state ──
const notifPlaying = ref(false)
const activeNotifIndex = ref(-1)
const NOTIFICATIONS = [
  { id: 'success', title: 'Success', message: 'Payment received successfully', color: '#10B981', icon: '✓', play: Presets.stamp },
  { id: 'alert', title: 'Alert', message: 'Low battery warning', color: '#F59E0B', icon: '!', play: Presets.peal },
  { id: 'message', title: 'Message', message: 'You have a new message', color: '#3B82F6', icon: '✉', play: Presets.chime },
  { id: 'error', title: 'Error', message: 'Connection failed', color: '#EF4444', icon: '✗', play: Presets.buzz },
  { id: 'reminder', title: 'Reminder', message: 'Meeting starts in 15 minutes', color: '#8B5CF6', icon: '⏰', play: Presets.swell },
]

function handlePlayNotifications() {
  if (notifPlaying.value) return
  notifPlaying.value = true
  let idx = 0
  const showNext = () => {
    if (idx >= NOTIFICATIONS.length) {
      activeNotifIndex.value = -1
      notifPlaying.value = false
      return
    }
    activeNotifIndex.value = idx
    NOTIFICATIONS[idx].play()
    idx++
    setTimeout(showNext, 1000)
  }
  showNext()
}

// ── Countdown demo state ──
const countdown = ref<number | null>(null)
const countdownRunning = ref(false)
const countdownAnimKey = ref(0)
let countdownTimer: ReturnType<typeof setInterval> | null = null

const tickPattern: Pattern = { discretePattern: [{ time: 0, amplitude: 0.6, frequency: 0.7 }, { time: 30, amplitude: 0, frequency: 0.7 }], continuousPattern: { amplitude: [], frequency: [] } }
const finalTickPattern: Pattern = { discretePattern: [{ time: 0, amplitude: 0.85, frequency: 0.85 }, { time: 40, amplitude: 0, frequency: 0.85 }], continuousPattern: { amplitude: [], frequency: [] } }
const completePattern: Pattern = { discretePattern: [{ time: 0, amplitude: 0.9, frequency: 0.5 }, { time: 50, amplitude: 0, frequency: 0.5 }, { time: 100, amplitude: 0.9, frequency: 0.5 }, { time: 150, amplitude: 0, frequency: 0.5 }], continuousPattern: { amplitude: [], frequency: [] } }

const tickComposer = createPatternComposer()
const finalTickComposer = createPatternComposer()
const completeComposer = createPatternComposer()

function handleStartCountdown() {
  if (countdownRunning.value) {
    if (countdownTimer) clearInterval(countdownTimer)
    countdownRunning.value = false
    countdown.value = null
    return
  }
  countdown.value = 7
  countdownRunning.value = true
  let count = 7
  countdownTimer = setInterval(() => {
    count--
    countdown.value = count
    countdownAnimKey.value++
    if (count > 3) {
      tickComposer.play()
    } else if (count > 0) {
      finalTickComposer.play()
    } else {
      completeComposer.play()
      if (countdownTimer) clearInterval(countdownTimer)
      countdownRunning.value = false
      setTimeout(() => (countdown.value = null), 2000)
    }
  }, 1000)
}

const countdownStatus = computed(() => {
  if (countdown.value === null && !countdownRunning.value) return 'Ready to start'
  if (countdownRunning.value && countdown.value !== null && countdown.value > 0) return countdown.value + ' seconds left'
  if (countdown.value === 0 && !countdownRunning.value) return 'Complete!'
  return ''
})

// ── Button demo patterns ──
const tapPattern: Pattern = { discretePattern: [{ time: 0, amplitude: 1.0, frequency: 1.0 }], continuousPattern: { amplitude: [], frequency: [] } }
const softPattern: Pattern = { discretePattern: [{ time: 0, amplitude: 0.4, frequency: 0.7 }], continuousPattern: { amplitude: [], frequency: [] } }
const deepPattern: Pattern = { discretePattern: [{ time: 0, amplitude: 0.9, frequency: 0.1 }], continuousPattern: { amplitude: [], frequency: [] } }
const doublePattern: Pattern = { discretePattern: [{ time: 0, amplitude: 0.9, frequency: 0.8 }, { time: 60, amplitude: 0.9, frequency: 0.8 }], continuousPattern: { amplitude: [], frequency: [] } }
const knockPattern: Pattern = { discretePattern: [{ time: 0, amplitude: 1.0, frequency: 0.3 }, { time: 180, amplitude: 0.8, frequency: 0.25 }], continuousPattern: { amplitude: [], frequency: [] } }
const ripplePattern: Pattern = { discretePattern: [{ time: 0, amplitude: 1.0, frequency: 0.7 }, { time: 70, amplitude: 0.7, frequency: 0.55 }, { time: 140, amplitude: 0.45, frequency: 0.45 }, { time: 210, amplitude: 0.25, frequency: 0.35 }], continuousPattern: { amplitude: [], frequency: [] } }

const tapComposer = createPatternComposer()
const softComposer = createPatternComposer()
const deepComposer = createPatternComposer()
const doubleComposer = createPatternComposer()
const knockComposer = createPatternComposer()
const rippleComposer = createPatternComposer()

// Parse all demo patterns once on mount.
onMounted(() => {
  tapComposer.parse(tapPattern)
  softComposer.parse(softPattern)
  deepComposer.parse(deepPattern)
  doubleComposer.parse(doublePattern)
  knockComposer.parse(knockPattern)
  rippleComposer.parse(ripplePattern)
  tickComposer.parse(tickPattern)
  finalTickComposer.parse(finalTickPattern)
  completeComposer.parse(completePattern)
  dotComposer1.parse(dotPattern1)
  dotComposer2.parse(dotPattern2)
  dotComposer3.parse(dotPattern3)
  quickTickComposer.parse(quickTickPattern)
  softTickComposer.parse(softTickPattern)
  deepTickComposer.parse(deepTickPattern)
})

// Drive the Dot Loader haptic schedule from the active demo (CSS owns animation).
function onSelectDotLoader() {
  selectDemo('dotloader')
  stopDotLoader()
  startDotLoader()
}

function tabPresets() {
  activeTab.value = 'presets'
}
function tabPlayground() {
  activeTab.value = 'playground'
}
function tabDemos() {
  activeTab.value = 'demos'
  activeDemo.value = ''
  stopDotLoader()
}
function toggleHelp() {
  helpOpen.value = !helpOpen.value
}

const COUNTDOWN_ANIM =
  '{ 0% { opacity: 0; transform: scale(0.5) translateY(20px); } 100% { opacity: 1; transform: scale(1) translateY(0px); } }'
const NOTIF_ANIM =
  '{ 0% { opacity: 0; transform: translateY(30px); } 70% { opacity: 1; transform: translateY(-5px); } 100% { opacity: 1; transform: translateY(0px); } }'
</script>

<template>
  <view class="page">
    <view class="tab-content">
      <!-- Home — always in DOM, shown/hidden via display -->
      <view
        class="tab-panel"
        :style="{ display: activeTab === 'home' ? 'flex' : 'none', flexDirection: 'column', zIndex: activeTab === 'home' ? 10 : 0 }"
      >
        <scroll-view scroll-orientation="vertical" :style="{ flex: 1 }">
          <view class="scroll-content">
            <text class="title" :style="{ marginTop: '30px', marginBottom: '30px' }">Welcome to Pulsar!</text>

            <view :style="{ position: 'relative' }">
              <view class="conn-badge" :style="{ position: 'absolute', top: '-12px', right: '-8px', zIndex: 2 }">
                <text class="conn-text">{{ connBadgeText }}</text>
                <view class="conn-dot" :style="{ backgroundColor: connDotColor }" />
              </view>

              <view class="card">
                <text class="section-title">Connect device</text>
                <text class="subtitle" :style="{ marginTop: '12px' }">{{ connSubtitleText }}</text>

                <view class="info-box" :style="{ display: infoBox ? 'flex' : 'none', marginTop: '16px' }">
                  <text class="info-box-text" :style="{ color: infoBox?.color || '#001A72' }">{{ infoBox?.text || '' }}</text>
                </view>

                <view :style="{ display: showDisconnectRow ? 'flex' : 'none', flexDirection: 'row', justifyContent: 'space-evenly', marginTop: '16px' }">
                  <view @tap="handleDisconnect">
                    <text class="disconnect-link">Disconnect</text>
                  </view>
                </view>

                <view :style="{ display: showConnectForm ? 'flex' : 'none', flexDirection: 'column' }">
                  <input
                    class="input-field"
                    placeholder="Connecting code"
                    :style="{ marginTop: '16px' }"
                    :value="connectingCode"
                    @input="onConnectingInput"
                  />

                  <view class="btn" :style="{ marginTop: '15px' }" @tap="handleOnConnect">
                    <text class="btn-text">{{ connectionState === 'CONNECTING' ? 'Connecting...' : 'Connect' }}</text>
                  </view>

                  <view class="collapsible-header" :style="{ marginTop: '16px' }" @tap="toggleHelp">
                    <text class="collapsible-chevron">{{ helpOpen ? 'v' : '>' }}</text>
                    <text class="collapsible-title">How to connect a device?</text>
                  </view>

                  <view :style="{ height: helpOpen ? 'auto' : '0px', overflow: 'hidden', flexDirection: 'column' }">
                    <view class="collapsible-body">
                      <view class="collapsible-step">
                        <text class="collapsible-step-num">1.</text>
                        <view :style="{ flex: 1 }">
                          <text class="collapsible-step-text">Open Pulsar documentation on Presets playground and find Device Connection section.</text>
                        </view>
                      </view>
                      <view class="collapsible-step">
                        <text class="collapsible-step-num">2.</text>
                        <view :style="{ flex: 1 }">
                          <text class="collapsible-step-text">Scan QR code or type Pairing code into PulsarApp and click Connect button.</text>
                        </view>
                      </view>
                      <view class="collapsible-step">
                        <text class="collapsible-step-num">3.</text>
                        <view :style="{ flex: 1 }">
                          <text class="collapsible-step-text">Select one of the presets on the website and experience the haptics right on your device.</text>
                        </view>
                      </view>
                    </view>
                  </view>
                </view>
              </view>
            </view>

            <view class="card" :style="{ display: showPatternNotification ? 'flex' : 'none', marginTop: '16px' }">
              <text class="section-title">{{ patternFound ? `${patternName} is playing!` : 'Preset not found!' }}</text>
            </view>
          </view>
        </scroll-view>
      </view>

      <!-- Presets — always in DOM -->
      <view
        class="tab-panel"
        :style="{ display: activeTab === 'presets' ? 'flex' : 'none', flexDirection: 'column', zIndex: activeTab === 'presets' ? 10 : 0 }"
      >
        <scroll-view scroll-orientation="vertical" :style="{ flex: 1 }">
          <view class="scroll-content">
            <text class="title">Get to know Pulsar presets</text>
            <text class="subtitle">Do not spend time creating your own patterns. Just use ours and enjoy the benefits of having haptics in your app. Haptics support: {{ supportLevel }}</text>

            <input class="search-input" placeholder="Search presets..." @input="onSearchInput" />

            <view :style="{ display: selectedTags.length > 0 ? 'flex' : 'none' }">
              <view class="tags-row">
                <view v-for="tag in selectedTags" :key="tag" class="tag-filter" @tap="handleRemoveTag(tag)">
                  <text class="tag-filter-text">{{ tag }}</text>
                  <text class="tag-filter-x">x</text>
                </view>
                <view class="tag-filter" @tap="handleClearTags">
                  <text class="tag-filter-text">Clear all</text>
                </view>
              </view>
            </view>

            <view v-for="preset in filteredPresets" :key="preset.name" class="preset-card">
              <view class="tags-row">
                <view v-for="tag in preset.tags" :key="tag" class="tag" @tap="handleAddTag(tag)">
                  <text class="tag-text">{{ tag }}</text>
                </view>
              </view>
              <text class="preset-name">{{ preset.name }}</text>
              <text class="preset-desc">{{ preset.description }}</text>
              <view class="preset-image-area" :style="{ position: 'relative' }">
                <image :src="presetImages[preset.name] || ''" :style="{ width: '350px', height: '160px' }" />
                <view
                  class="preset-progress-bar"
                  :style="{
                    left: (playingPresetName === preset.name ? playProgress * 3.5 : -10) + 'px',
                    opacity: playingPresetName === preset.name ? 1 : 0,
                  }"
                />
              </view>
              <view
                class="preset-play-btn"
                @tap="handlePlayPreset(preset)"
                :style="{
                  transform: playingPresetName === preset.name ? 'translate(-3px, 3px)' : 'translate(0px, 0px)',
                  boxShadow: playingPresetName === preset.name ? '0px 0px 0px #38ACDD' : '-3px 3px 0px #38ACDD',
                }"
              >
                <text class="preset-play-text">{{ playingPresetName === preset.name ? 'Stop ■' : 'Play ▷' }}</text>
              </view>
            </view>

            <view :style="{ display: filteredPresets.length === 0 ? 'flex' : 'none' }">
              <view class="card">
                <text class="subtitle" :style="{ textAlign: 'center', marginBottom: 0 }">No presets match your search or filters</text>
              </view>
            </view>

            <view :style="{ height: '40px' }" />
          </view>
        </scroll-view>
      </view>

      <!-- Playground — always in DOM -->
      <view
        class="tab-panel"
        :style="{ display: activeTab === 'playground' ? 'flex' : 'none', flexDirection: 'column', zIndex: activeTab === 'playground' ? 10 : 0 }"
      >
        <scroll-view scroll-orientation="vertical" :style="{ flex: 1 }">
          <view class="scroll-content">
            <view :style="{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }">
              <text class="title" :style="{ marginBottom: 0 }">Playground</text>
              <text :style="{ fontSize: '14px', color: '#2B85AB' }">How does it work?</text>
            </view>

            <view class="pg-grid" @touchstart="handlePgTouchStart" @touchmove="handlePgTouchMove" @touchend="handlePgTouchEnd">
              <view class="pg-hint">
                <text class="pg-hint-text">Tap to trigger haptic impulse</text>
              </view>
              <view class="pg-indicator" :style="{ left: pgIndicatorX + 'px', top: pgIndicatorY + 'px' }" />
            </view>

            <view class="pg-timer-row">
              <text class="pg-timer-label">{{ pgTimerLabel }}</text>
              <text class="pg-timer-value">{{ pgTimerText }}</text>
            </view>

            <view class="pg-controls">
              <view class="pg-btn-icon" :class="{ 'pg-btn-disabled': !pgRecorded }" @tap="handlePgPlay">
                <text class="pg-btn-icon-text">{{ pgPlaying ? '■' : '▶' }}</text>
              </view>
              <view class="pg-btn-record" @tap="handlePgRecord">
                <text class="pg-btn-record-text">{{ pgRecording ? 'Stop' : 'Record ●' }}</text>
              </view>
              <view class="pg-btn-icon" :class="{ 'pg-btn-disabled': !pgRecorded }">
                <text class="pg-btn-icon-text">{{ '⬇' }}</text>
              </view>
            </view>
          </view>
        </scroll-view>
      </view>

      <!-- Demos — always in DOM -->
      <view
        class="tab-panel"
        :style="{ display: activeTab === 'demos' ? 'flex' : 'none', flexDirection: 'column', zIndex: activeTab === 'demos' ? 10 : 0 }"
      >
        <view class="demo-container">
          <!-- Demo Menu -->
          <view class="demo-panel" :style="{ display: activeDemo === '' ? 'flex' : 'none', flexDirection: 'column', zIndex: activeDemo === '' ? 10 : 0 }">
            <scroll-view scroll-orientation="vertical" :style="{ flex: 1 }">
              <view class="scroll-content">
                <text class="title">Haptics demos</text>
                <text class="subtitle">Feel them with real use cases.</text>
                <view
                  v-for="demo in DEMO_LIST"
                  :key="demo.id"
                  class="demo-card"
                  @tap="demo.id === 'dotloader' ? onSelectDotLoader() : selectDemo(demo.id)"
                >
                  <text class="demo-card-title">{{ demo.title }}</text>
                  <text class="demo-card-chevron">{{ '>' }}</text>
                </view>
                <view :style="{ height: '40px' }" />
              </view>
            </scroll-view>
          </view>

          <!-- Demo: Buttons -->
          <view class="demo-panel" :style="{ display: activeDemo === 'buttons' ? 'flex' : 'none', flexDirection: 'column', zIndex: activeDemo === 'buttons' ? 10 : 0 }">
            <scroll-view scroll-orientation="vertical" :style="{ flex: 1 }">
              <view class="scroll-content">
                <view class="back-row" @tap="handleBackToMenu"><text class="back-text">{{ '< Back' }}</text></view>
                <text class="section-title">Buttons haptics grid</text>
                <text class="subtitle">Tap each button to feel a different haptic pattern.</text>
                <view class="btn-grid">
                  <view class="btn-grid-item"><view class="btn-grid-btn" :class="{ 'btn-grid-btn-pressed': pressedBtn === 'tap' }" @tap="handleDemoBtnPress('tap', tapComposer.play)"><text class="btn-grid-btn-text">Tap</text></view></view>
                  <view class="btn-grid-item"><view class="btn-grid-btn" :class="{ 'btn-grid-btn-pressed': pressedBtn === 'soft' }" @tap="handleDemoBtnPress('soft', softComposer.play)"><text class="btn-grid-btn-text">Soft</text></view></view>
                  <view class="btn-grid-item"><view class="btn-grid-btn" :class="{ 'btn-grid-btn-pressed': pressedBtn === 'deep' }" @tap="handleDemoBtnPress('deep', deepComposer.play)"><text class="btn-grid-btn-text">Deep</text></view></view>
                  <view class="btn-grid-item"><view class="btn-grid-btn" :class="{ 'btn-grid-btn-pressed': pressedBtn === 'double' }" @tap="handleDemoBtnPress('double', doubleComposer.play)"><text class="btn-grid-btn-text">Double</text></view></view>
                  <view class="btn-grid-item"><view class="btn-grid-btn" :class="{ 'btn-grid-btn-pressed': pressedBtn === 'knock' }" @tap="handleDemoBtnPress('knock', knockComposer.play)"><text class="btn-grid-btn-text">Knock</text></view></view>
                  <view class="btn-grid-item"><view class="btn-grid-btn" :class="{ 'btn-grid-btn-pressed': pressedBtn === 'ripple' }" @tap="handleDemoBtnPress('ripple', rippleComposer.play)"><text class="btn-grid-btn-text">Ripple</text></view></view>
                </view>
              </view>
            </scroll-view>
          </view>

          <!-- Demo: Countdown Timer -->
          <view class="demo-panel" :style="{ display: activeDemo === 'countdown' ? 'flex' : 'none', flexDirection: 'column', zIndex: activeDemo === 'countdown' ? 10 : 0 }">
            <scroll-view scroll-orientation="vertical" :style="{ flex: 1 }">
              <view class="scroll-content">
                <view class="back-row" @tap="handleBackToMenu"><text class="back-text">{{ '< Back' }}</text></view>
                <text class="section-title">Countdown timer</text>
                <text class="subtitle">Experience haptic feedback synced to a countdown timer.</text>

                <view class="countdown-card">
                  <view class="countdown-center">
                    <text
                      :key="'cd-' + countdownAnimKey"
                      :class="countdown !== null && countdown > 0 && countdown <= 3 ? 'countdown-number countdown-number-red' : 'countdown-number'"
                      :style="countdownAnimKey > 0 ? { animationName: COUNTDOWN_ANIM, animationDuration: '300ms', animationTimingFunction: 'ease-out' } : {}"
                    >{{ countdown !== null ? countdown : '...' }}</text>
                  </view>
                  <text class="countdown-status">{{ countdownStatus }}</text>
                </view>

                <view class="countdown-controls">
                  <view class="btn" @tap="handleStartCountdown">
                    <text class="btn-text">{{ countdown === null ? 'Start Countdown' : 'Reset' }}</text>
                  </view>
                </view>
              </view>
            </scroll-view>
          </view>

          <!-- Demo: Notification Haptics -->
          <view class="demo-panel" :style="{ display: activeDemo === 'notification' ? 'flex' : 'none', flexDirection: 'column', zIndex: activeDemo === 'notification' ? 10 : 0 }">
            <scroll-view scroll-orientation="vertical" :style="{ flex: 1 }">
              <view class="scroll-content">
                <view class="back-row" @tap="handleBackToMenu"><text class="back-text">{{ '< Back' }}</text></view>
                <text class="section-title">Notification Haptics</text>
                <text class="subtitle">Each notification type has its own unique haptic pattern that matches its intention.</text>

                <view class="notif-display">
                  <view
                    v-if="activeNotifIndex >= 0 && activeNotifIndex < NOTIFICATIONS.length"
                    :key="NOTIFICATIONS[activeNotifIndex].id"
                    class="notif-card"
                    :style="{ animationName: NOTIF_ANIM, animationDuration: '400ms', animationTimingFunction: 'ease-out' }"
                  >
                    <view class="notif-icon-badge" :style="{ backgroundColor: NOTIFICATIONS[activeNotifIndex].color }">
                      <text class="notif-icon-text">{{ NOTIFICATIONS[activeNotifIndex].icon }}</text>
                    </view>
                    <view class="notif-content">
                      <text class="notif-title">{{ NOTIFICATIONS[activeNotifIndex].title }}</text>
                      <text class="notif-message">{{ NOTIFICATIONS[activeNotifIndex].message }}</text>
                    </view>
                  </view>
                </view>

                <view class="notif-btn-container">
                  <view class="btn" @tap="handlePlayNotifications">
                    <text class="btn-text">{{ notifPlaying ? 'Playing...' : 'Play All Notifications' }}</text>
                  </view>
                </view>
              </view>
            </scroll-view>
          </view>

          <!-- Demo: Dot Loader -->
          <view class="demo-panel" :style="{ display: activeDemo === 'dotloader' ? 'flex' : 'none', flexDirection: 'column', zIndex: activeDemo === 'dotloader' ? 10 : 0 }">
            <scroll-view scroll-orientation="vertical" :style="{ flex: 1 }">
              <view class="scroll-content">
                <view class="back-row" @tap="handleBackToMenu"><text class="back-text">{{ '< Back' }}</text></view>
                <text class="section-title">Wavy Dot Loader</text>
                <text class="subtitle">Watch the three dots move in a wave pattern and feel the haptic feedback each time a dot hits the bottom.</text>

                <view class="dot-loader-area">
                  <view class="dot-container">
                    <view v-for="i in [0, 1, 2]" v-show="activeDemo === 'dotloader'" :key="i" class="dot-wrapper">
                      <view class="dot" :style="{ animationDelay: i * 220 + 'ms' }" />
                    </view>
                  </view>
                </view>
              </view>
            </scroll-view>
          </view>

          <!-- Demo: Haptic Sliders -->
          <view class="demo-panel" :style="{ display: activeDemo === 'slider' ? 'flex' : 'none', flexDirection: 'column', zIndex: activeDemo === 'slider' ? 10 : 0 }">
            <scroll-view scroll-orientation="vertical" :style="{ flex: 1 }">
              <view class="scroll-content">
                <view class="back-row" @tap="handleBackToMenu"><text class="back-text">{{ '< Back' }}</text></view>
                <text class="section-title">Slider haptics</text>
                <text class="subtitle">Move each slider to feel different haptic characteristics. Each slider plays a unique haptic feedback when crossing ticks.</text>

                <view class="slider-card">
                  <text class="slider-label">Quick Tick</text>
                  <text class="slider-value">{{ slider1 }}%</text>
                  <view class="slider-track-container" @touchstart="handleSliderMove(1, $event)" @touchmove="handleSliderMove(1, $event)" @layoutchange="handleSliderLayout(1, $event)">
                    <view class="slider-track">
                      <view class="slider-fill" :style="{ width: slider1 + '%' }" />
                    </view>
                    <view class="slider-ticks">
                      <view v-for="t in [0,1,2,3,4,5,6,7,8,9,10]" :key="t" class="slider-tick" :class="{ 'slider-tick-active': t * 10 <= slider1 }" />
                    </view>
                    <view class="slider-thumb" :style="{ left: thumbLeft(slider1, 1) }" />
                  </view>
                </view>

                <view class="slider-card">
                  <text class="slider-label">Soft Tick</text>
                  <text class="slider-value">{{ slider2 }}%</text>
                  <view class="slider-track-container" @touchstart="handleSliderMove(2, $event)" @touchmove="handleSliderMove(2, $event)" @layoutchange="handleSliderLayout(2, $event)">
                    <view class="slider-track">
                      <view class="slider-fill" :style="{ width: slider2 + '%' }" />
                    </view>
                    <view class="slider-ticks">
                      <view v-for="t in [0,1,2,3,4,5,6,7,8,9,10]" :key="t" class="slider-tick" :class="{ 'slider-tick-active': t * 10 <= slider2 }" />
                    </view>
                    <view class="slider-thumb" :style="{ left: thumbLeft(slider2, 2) }" />
                  </view>
                </view>

                <view class="slider-card">
                  <text class="slider-label">Deep Tick</text>
                  <text class="slider-value">{{ slider3 }}%</text>
                  <view class="slider-track-container" @touchstart="handleSliderMove(3, $event)" @touchmove="handleSliderMove(3, $event)" @layoutchange="handleSliderLayout(3, $event)">
                    <view class="slider-track">
                      <view class="slider-fill" :style="{ width: slider3 + '%' }" />
                    </view>
                    <view class="slider-ticks">
                      <view v-for="t in [0,1,2,3,4,5,6,7,8,9,10]" :key="t" class="slider-tick" :class="{ 'slider-tick-active': t * 10 <= slider3 }" />
                    </view>
                    <view class="slider-thumb" :style="{ left: thumbLeft(slider3, 3) }" />
                  </view>
                </view>
              </view>
            </scroll-view>
          </view>

          <!-- Demo: Balloon Pop -->
          <view class="demo-panel" :style="{ display: activeDemo === 'balloon' ? 'flex' : 'none', flexDirection: 'column', zIndex: activeDemo === 'balloon' ? 10 : 0 }">
            <scroll-view scroll-orientation="vertical" :style="{ flex: 1 }">
              <view class="scroll-content">
                <view class="back-row" @tap="handleBackToMenu"><text class="back-text">{{ '< Back' }}</text></view>
                <text class="section-title">Balloon Pop</text>
                <text class="subtitle">Hold to inflate, release to deflate. Keep holding until it pops!</text>

                <view class="balloon-grid">
                  <view v-for="i in [0, 1, 2, 3]" :key="i" class="balloon-cell" @touchstart="balloonStart(i)" @touchend="balloonEnd(i)">
                    <text v-if="balloonPopped[i]" class="balloon-popped">{{ '\u{1F4A5}' }}</text>
                    <view v-else :style="{ alignItems: 'center' }">
                      <text class="balloon-emoji" :style="{ transform: `scale(${0.5 + balloonProgress[i] * 0.8})` }">{{ '\u{1F388}' }}</text>
                      <text class="balloon-hint">{{ Math.round(balloonProgress[i] * 100) }}%</text>
                    </view>
                  </view>
                </view>
              </view>
            </scroll-view>
          </view>

          <!-- Demo: Sensor Haptics -->
          <view class="demo-panel" :style="{ display: activeDemo === 'sensor' ? 'flex' : 'none', flexDirection: 'column', zIndex: activeDemo === 'sensor' ? 10 : 0 }">
            <view :style="{ flex: 1, paddingTop: '60px', paddingLeft: '20px', paddingRight: '20px', paddingBottom: '20px', display: 'flex', flexDirection: 'column' }">
              <view class="back-row" @tap="handleBackToMenu"><text class="back-text">{{ '< Back' }}</text></view>
              <text class="section-title">Sensor Haptics</text>
              <text class="subtitle">Drag the dot inside the circle. Feel haptics on movement and boundary collision.</text>

              <view class="sensor-container">
                <view class="sensor-circle" @touchstart="handleSensorTouch" @touchmove="handleSensorTouch">
                  <view class="sensor-dot" :style="{ left: sensorDotX + 'px', top: sensorDotY + 'px' }" />
                </view>
              </view>

              <text class="sensor-fallback-hint">Touch fallback mode — drag to interact</text>
              <text class="sensor-note">Accelerometer API is not yet available in Lynx. The original app uses device tilt to drive the dot position with physics-based velocity, damping, and elastic boundary collision.</text>
            </view>
          </view>
        </view>
      </view>
    </view>

    <!-- Bottom Tab Bar -->
    <view class="tab-bar">
      <!-- Home tab hidden — "Connect device" needs WebSocket, not yet supported in Lynx. -->
      <view class="tab" :class="{ 'tab-active': activeTab === 'presets' }" @tap="tabPresets">
        <image :src="activeTab === 'presets' ? iconListActive : iconListInactive" :style="{ width: '24px', height: '24px' }" />
        <text class="tab-label" :class="{ 'tab-label-active': activeTab === 'presets' }">Presets</text>
      </view>
      <view class="tab" :class="{ 'tab-active': activeTab === 'playground' }" @tap="tabPlayground">
        <image :src="activeTab === 'playground' ? iconBrushActive : iconBrushInactive" :style="{ width: '24px', height: '24px' }" />
        <text class="tab-label" :class="{ 'tab-label-active': activeTab === 'playground' }">Playground</text>
      </view>
      <view class="tab" :class="{ 'tab-active': activeTab === 'demos' }" @tap="tabDemos">
        <image :src="activeTab === 'demos' ? iconSparklesActive : iconSparklesInactive" :style="{ width: '24px', height: '24px' }" />
        <text class="tab-label" :class="{ 'tab-label-active': activeTab === 'demos' }">Demos</text>
      </view>
    </view>
  </view>
</template>
