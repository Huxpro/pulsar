import { useState, useEffect, useRef } from "@lynx-js/react";
import { Presets, Settings, usePatternComposer } from "lynx-pulsar";
import type { Pattern } from "lynx-pulsar";
import { ALL_PRESETS } from "./presetData.js";
import type { PresetMeta } from "./presetData.js";
import presetImages from "./presetImages.js";
import "./App.css";

// Tab bar icons (PNG, converted from PulsarApp SVGs)
import iconHomeActive from "./assets/icons/home-active.png";
import iconHomeInactive from "./assets/icons/home-inactive.png";
import iconListActive from "./assets/icons/list-active.png";
import iconListInactive from "./assets/icons/list-inactive.png";
import iconBrushActive from "./assets/icons/brush-active.png";
import iconBrushInactive from "./assets/icons/brush-inactive.png";
import iconSparklesActive from "./assets/icons/sparkles-active.png";
import iconSparklesInactive from "./assets/icons/sparkles-inactive.png";

const SOCKET_SERVER_URL = "wss://pulsar-server.swmansion.com";

type ConnectionState =
  | "DISCONNECTED"
  | "CONNECTING"
  | "CONNECTED_TO_SERVER"
  | "FULLY_CONNECTED"
  | "ERROR";

type ErrorType = "INVALID_DATA" | "CONNECTION_FAILED" | null;

function playPattern(patternName: string): boolean {
  if (patternName.includes("System")) {
    const key = patternName.replace("System", "").replace("Preset", "");
    const normalizedKey = `${key.charAt(0).toLowerCase()}${key.slice(1)}`;
    const systemPreset = (Presets.System as any)[normalizedKey] ?? (Presets.System as any)[key];
    if (typeof systemPreset === "function") {
      systemPreset();
      return true;
    }
    const androidPreset = (Presets.System.Android as any)?.[normalizedKey] ?? (Presets.System.Android as any)?.[key];
    if (typeof androidPreset === "function") {
      androidPreset();
      return true;
    }
    return false;
  }
  const normalizedName = `${patternName.charAt(0).toLowerCase()}${patternName.slice(1)}`;
  const preset = (Presets as any)[patternName] ?? (Presets as any)[normalizedName];
  if (typeof preset === "function") {
    preset();
    return true;
  }
  return false;
}

export function App() {
  // Home tab is hidden in the tab bar below: the "Connect device" pairing flow
  // depends on WebSocket, which Lynx does not yet expose. Default to "presets"
  // so the app opens straight onto the working surface.
  const [activeTab, setActiveTab] = useState<string>("presets");
  const [helpOpen, setHelpOpen] = useState(false);

  // ── Connection state ──
  const [connectionState, setConnectionState] = useState<ConnectionState>("DISCONNECTED");
  const [errorType, setErrorType] = useState<ErrorType>(null);
  const [connectingCode, setConnectingCode] = useState("");
  const [showPatternNotification, setShowPatternNotification] = useState(false);
  const [patternFound, setPatternFound] = useState(false);
  const [patternName, setPatternName] = useState("");
  const socketRef = useRef<WebSocket | null>(null);
  const pingIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const connectingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const patternNotificationTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showPatternReceivedNotification = (found: boolean, name: string) => {
    if (patternNotificationTimeoutRef.current) {
      clearTimeout(patternNotificationTimeoutRef.current);
    }
    setPatternFound(found);
    setPatternName(name);
    setShowPatternNotification(true);
    patternNotificationTimeoutRef.current = setTimeout(() => {
      setShowPatternNotification(false);
      patternNotificationTimeoutRef.current = null;
    }, 1000);
  };

  const handleOnConnect = () => {
    setErrorType(null);
    if (pingIntervalRef.current) {
      clearInterval(pingIntervalRef.current);
      pingIntervalRef.current = null;
    }
    if (connectingTimeoutRef.current) {
      clearTimeout(connectingTimeoutRef.current);
      connectingTimeoutRef.current = null;
    }

    const code = connectingCode.trim();
    if (code.length === 0) return;

    const query = `type=receiver&action=new_connection&code=${encodeURIComponent(code)}`;
    const socketUrl = `${SOCKET_SERVER_URL}?${query}`;

    if (socketRef.current) {
      socketRef.current.close();
      socketRef.current = null;
    }

    const socket = new WebSocket(socketUrl);
    socketRef.current = socket;
    let hadError = false;

    connectingTimeoutRef.current = setTimeout(() => {
      if (socketRef.current === socket) {
        socket.close();
        setConnectionState("ERROR");
        setErrorType("CONNECTION_FAILED");
      }
    }, 15_000);

    setConnectionState("CONNECTING");

    socket.onopen = () => {
      if (connectingTimeoutRef.current) {
        clearTimeout(connectingTimeoutRef.current);
        connectingTimeoutRef.current = null;
      }
      setConnectionState("CONNECTED_TO_SERVER");
      pingIntervalRef.current = setInterval(() => {
        if (socketRef.current?.readyState === WebSocket.OPEN) {
          socketRef.current.send(JSON.stringify({ type: "ping" }));
        }
      }, 25_000);
    };

    socket.onmessage = (event: MessageEvent) => {
      const payload = typeof event.data === "string" ? event.data : "";
      try {
        const json = JSON.parse(payload) as { type?: string; token?: string; message?: string };
        if (json.type === "connection_established") {
          setConnectionState("FULLY_CONNECTED");
          Presets.breakingWave();
        } else if (json.type === "connection_restored") {
          setConnectionState("FULLY_CONNECTED");
          Presets.breakingWave();
        } else if (json.type === "peer_disconnected") {
          setConnectionState("CONNECTED_TO_SERVER");
        } else if (json.type === "pong") {
          // keepalive response — no-op
        } else if (json.type === "broadcast") {
          if (json.message) {
            const found = playPattern(json.message);
            showPatternReceivedNotification(found, json.message);
          }
        }
      } catch {
        // parse error — ignore
      }
    };

    socket.onerror = () => {
      if (socketRef.current !== socket) return;
      hadError = true;
      setConnectionState("ERROR");
      setErrorType("CONNECTION_FAILED");
      Presets.chirp();
    };

    socket.onclose = (e: CloseEvent) => {
      if (socketRef.current !== socket) return;
      if (connectingTimeoutRef.current) {
        clearTimeout(connectingTimeoutRef.current);
        connectingTimeoutRef.current = null;
      }
      if (pingIntervalRef.current) {
        clearInterval(pingIntervalRef.current);
        pingIntervalRef.current = null;
      }
      if (e.code !== 1000 && !hadError) {
        setConnectionState("ERROR");
        setErrorType("INVALID_DATA");
        Presets.chirp();
      } else if (e.code === 1000) {
        setConnectionState("DISCONNECTED");
      }
    };
  };

  const handleDisconnect = () => {
    Presets.powerDown();
    socketRef.current?.close();
    socketRef.current = null;
    if (pingIntervalRef.current) {
      clearInterval(pingIntervalRef.current);
      pingIntervalRef.current = null;
    }
    if (connectingTimeoutRef.current) {
      clearTimeout(connectingTimeoutRef.current);
      connectingTimeoutRef.current = null;
    }
    setConnectingCode("");
    setConnectionState("DISCONNECTED");
    setErrorType(null);
  };

  // Connection badge helpers
  const connBadgeText = () => {
    switch (connectionState) {
      case "CONNECTING":
      case "CONNECTED_TO_SERVER":
        return "Waiting";
      case "FULLY_CONNECTED":
        return "Connected";
      default:
        return "Not connected";
    }
  };

  const connDotColor = (): string => {
    switch (connectionState) {
      case "CONNECTING":
      case "CONNECTED_TO_SERVER":
        return "#E1F3FA";
      case "FULLY_CONNECTED":
        return "#57B495";
      default:
        return "#FF6259";
    }
  };

  const connSubtitleText = () => {
    switch (connectionState) {
      case "FULLY_CONNECTED":
        return "Everything is ready, you can start testing the presets.";
      default:
        return "Connect your haptic device first. Pair it with the app now so you can test the presets.";
    }
  };

  const infoBoxContent = (): { text: string; color: string } | null => {
    switch (connectionState) {
      case "CONNECTING":
        return { text: "Connecting to server...", color: "#001A72" };
      case "CONNECTED_TO_SERVER":
        return { text: "Waiting for browser connection...", color: "#ffac59" };
      case "FULLY_CONNECTED":
        return { text: "You are connected with the browser!", color: "#57B495" };
      case "ERROR":
        return {
          text: errorType === "INVALID_DATA" ? "Invalid data. Please try again." : "Unable to connect with the server!",
          color: "#FF6259",
        };
      default:
        return null;
    }
  };

  const showConnectForm = connectionState === "DISCONNECTED" || connectionState === "ERROR";
  const showDisconnectRow = connectionState === "CONNECTING" || connectionState === "CONNECTED_TO_SERVER" || connectionState === "FULLY_CONNECTED";
  const infoBox = infoBoxContent();

  // ── Presets state ──
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [supportLevel, setSupportLevel] = useState("Unknown");

  useEffect(() => {
    const level = Settings.getHapticsSupportLevel();
    const labels: Record<number, string> = { 0: "None", 2: "Limited", 3: "Standard", 4: "Advanced" };
    setSupportLevel(labels[level] || "Unknown");
  }, []);

  // Tag groups — AND across groups, OR within each group
  const TAG_GROUPS: Record<string, string[]> = {
    Intensity: ["Gentle", "Substantial", "Bold"],
    Sharpness: ["Soft", "Flexible", "Rigid"],
    Shape: ["Peak", "Impulses", "Solid", "Bumps", "Saw", "Pattern", "Ramp"],
    Duration: ["Impulse", "Short", "Extended", "Long"],
  };

  const filteredPresets = ALL_PRESETS.filter((p) => {
    const q = searchQuery.toLowerCase();
    const matchesSearch = !q || p.name.toLowerCase().includes(q) || p.description.toLowerCase().includes(q) || p.tags.some((t) => t.toLowerCase().includes(q));

    // Group selected tags by dimension
    let matchesTags = true;
    if (selectedTags.length > 0) {
      const selectedByGroup: Record<string, string[]> = {};
      for (const tag of selectedTags) {
        for (const [group, members] of Object.entries(TAG_GROUPS)) {
          if (members.includes(tag)) {
            if (!selectedByGroup[group]) selectedByGroup[group] = [];
            selectedByGroup[group].push(tag);
          }
        }
      }
      // AND across groups: preset must match at least one selected tag from each active group
      for (const group in selectedByGroup) {
        const tagsInGroup = selectedByGroup[group];
        if (!tagsInGroup.some((t) => p.tags.includes(t))) {
          matchesTags = false;
          break;
        }
      }
    }

    return matchesSearch && matchesTags;
  });

  // ── Playground state ──
  const [pgIndicatorX, setPgIndicatorX] = useState(-100);
  const [pgIndicatorY, setPgIndicatorY] = useState(-100);
  const [pgRecording, setPgRecording] = useState(false);
  const [pgRecorded, setPgRecorded] = useState(false);
  const [pgPlaying, setPgPlaying] = useState(false);
  const [pgTimerText, setPgTimerText] = useState("0.0s");
  const pgTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const pgStartRef = useRef(0);
  const pgDurationRef = useRef(0);
  const pgLastHapticRef = useRef(0);
  // Recorded touch events: [{time, x, y, type}]
  const pgEventsRef = useRef<Array<{ time: number; x: number; y: number; type: string }>>([]);
  const pgPlayTimersRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  const handlePgTouchStart = (e: any) => {
    const touch = e.changedTouches?.[0] || e.touches?.[0];
    if (!touch) return;
    const x = touch.pageX - 35;
    const y = touch.pageY - 200;
    setPgIndicatorX(x);
    setPgIndicatorY(y);
    Presets.System.impactLight();
    pgLastHapticRef.current = Date.now();
    // Record if recording
    if (pgRecording) {
      pgEventsRef.current.push({ time: Date.now() - pgStartRef.current, x, y, type: "tap" });
    }
  };

  const handlePgTouchMove = (e: any) => {
    const touch = e.changedTouches?.[0] || e.touches?.[0];
    if (!touch) return;
    const x = touch.pageX - 35;
    const y = touch.pageY - 200;
    setPgIndicatorX(x);
    setPgIndicatorY(y);
    // Throttle haptics to every 80ms during drag
    const now = Date.now();
    if (now - pgLastHapticRef.current > 80) {
      Presets.System.selection();
      pgLastHapticRef.current = now;
      // Record if recording
      if (pgRecording) {
        pgEventsRef.current.push({ time: now - pgStartRef.current, x, y, type: "move" });
      }
    }
  };

  const handlePgTouchEnd = () => {
    setPgIndicatorX(-100);
    setPgIndicatorY(-100);
  };

  const handlePgRecord = () => {
    if (pgRecording) {
      // Stop recording
      setPgRecording(false);
      setPgRecorded(true);
      pgDurationRef.current = Date.now() - pgStartRef.current;
      if (pgTimerRef.current) clearInterval(pgTimerRef.current);
      pgTimerRef.current = null;
    } else {
      // Start recording
      setPgRecording(true);
      setPgRecorded(false);
      setPgPlaying(false);
      pgEventsRef.current = [];
      pgStartRef.current = Date.now();
      setPgTimerText("0.0s");
      pgTimerRef.current = setInterval(() => {
        const elapsed = (Date.now() - pgStartRef.current) / 1000;
        setPgTimerText(elapsed.toFixed(1) + "s");
      }, 100);
    }
  };

  const handlePgPlay = () => {
    if (!pgRecorded || pgPlaying) return;
    if (pgEventsRef.current.length === 0) return;
    setPgPlaying(true);
    const totalSec = (pgDurationRef.current / 1000).toFixed(1);
    const playStart = Date.now();

    // Schedule each recorded event for replay
    const timers: ReturnType<typeof setTimeout>[] = [];
    for (const evt of pgEventsRef.current) {
      const t = setTimeout(() => {
        setPgIndicatorX(evt.x);
        setPgIndicatorY(evt.y);
        if (evt.type === "tap") {
          Presets.System.impactLight();
        } else {
          Presets.System.selection();
        }
      }, evt.time);
      timers.push(t);
    }
    // Hide indicator at the end
    const endTimer = setTimeout(() => {
      setPgIndicatorX(-100);
      setPgIndicatorY(-100);
    }, pgDurationRef.current);
    timers.push(endTimer);
    pgPlayTimersRef.current = timers;

    // Timer display during playback
    const interval = setInterval(() => {
      const elapsedSec = ((Date.now() - playStart) / 1000).toFixed(1);
      setPgTimerText(elapsedSec + "s / " + totalSec + "s");
      if (Date.now() - playStart >= pgDurationRef.current) {
        clearInterval(interval);
        setPgPlaying(false);
        setPgTimerText(totalSec + "s");
      }
    }, 100);
  };

  // ── Demos state ──
  const [activeDemo, setActiveDemo] = useState("");
  const DEMO_LIST = [
    { id: "slider", title: "Slider" },
    { id: "buttons", title: "Buttons" },
    { id: "countdown", title: "Countdown timer" },
    { id: "balloon", title: "Balloon" },
    { id: "dotloader", title: "Dot Loader" },
    { id: "notification", title: "Notification" },
    { id: "sensor", title: "Sensor Haptics" },
  ];
  const handleBackToMenu = () => setActiveDemo("");

  // ── Button press animation state ──
  const [pressedBtn, setPressedBtn] = useState("");
  const handleDemoBtnPress = (id: string, play: () => void) => {
    play();
    setPressedBtn(id);
    setTimeout(() => setPressedBtn(""), 200);
  };

  // ── Sensor demo state (touch-based fallback since no accelerometer API in Lynx) ──
  const [sensorDotX, setSensorDotX] = useState(128); // center of 280px circle - 24px dot / 2
  const [sensorDotY, setSensorDotY] = useState(128);
  const sensorLastHapticRef = useRef(0);
  const CIRCLE_R = 140; // circle radius
  const DOT_R = 12; // dot radius
  const CIRCLE_CX = 140; // circle center
  const CIRCLE_CY = 140;

  const handleSensorTouch = (e: any) => {
    const touch = e.changedTouches?.[0] || e.touches?.[0];
    if (!touch) return;
    // Convert page coordinates to circle-local coordinates
    // The circle is centered in the screen — estimate its position
    // We'll use the touch offset relative to center
    const circlePageX = touch.pageX;
    const circlePageY = touch.pageY;

    // We need to know where the circle element is. Use a rough estimate:
    // circle is centered horizontally, and vertically in the flex container
    // Let's compute relative to the first touch as an offset approach
    // Simpler: use touch position relative to an assumed circle center
    // For now, use the raw offset within the touch target
    const localX = touch.offsetX !== undefined ? touch.offsetX : circlePageX - 50;
    const localY = touch.offsetY !== undefined ? touch.offsetY : circlePageY - 300;

    // Clamp to circle boundary
    const dx = localX - CIRCLE_CX;
    const dy = localY - CIRCLE_CY;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const maxDist = CIRCLE_R - DOT_R;

    let finalX = localX - DOT_R;
    let finalY = localY - DOT_R;

    if (dist > maxDist) {
      // Hit boundary — clamp and trigger collision haptic
      const scale = maxDist / dist;
      finalX = CIRCLE_CX + dx * scale - DOT_R;
      finalY = CIRCLE_CY + dy * scale - DOT_R;

      const now = Date.now();
      if (now - sensorLastHapticRef.current > 150) {
        Presets.System.impactMedium(); // boundary collision
        sensorLastHapticRef.current = now;
      }
    } else {
      // Moving freely — rolling haptic
      const now = Date.now();
      if (now - sensorLastHapticRef.current > 100) {
        Presets.System.selection(); // rolling texture
        sensorLastHapticRef.current = now;
      }
    }

    setSensorDotX(finalX);
    setSensorDotY(finalY);
  };

  // ── Balloon demo state ──
  // Each balloon: { progress: 0-1, popped: bool, inflating: bool }
  const [balloonProgress, setBalloonProgress] = useState([0, 0, 0, 0]);
  const [balloonPopped, setBalloonPopped] = useState([false, false, false, false]);
  const balloonIntervalRef = useRef<(ReturnType<typeof setInterval> | null)[]>([null, null, null, null]);

  const handleBalloonStart = (index: number) => () => {
    if (balloonPopped[index]) return;
    // Start inflating: increase progress every 50ms
    const interval = setInterval(() => {
      setBalloonProgress((prev) => {
        const next = [...prev];
        next[index] = Math.min(1, next[index] + 0.02); // ~2.5 seconds to full

        // Escalating haptics based on progress
        if (next[index] < 0.5) {
          Presets.System.selection(); // light
        } else if (next[index] < 0.9) {
          Presets.System.impactLight(); // medium
        } else if (next[index] < 1) {
          Presets.System.impactMedium(); // intense
        }

        // POP!
        if (next[index] >= 1) {
          Presets.System.impactHeavy();
          clearInterval(interval);
          balloonIntervalRef.current[index] = null;
          setBalloonPopped((prev) => {
            const p = [...prev];
            p[index] = true;
            return p;
          });
          // Reset after 1.5s
          setTimeout(() => {
            setBalloonPopped((prev) => {
              const p = [...prev];
              p[index] = false;
              return p;
            });
            setBalloonProgress((prev) => {
              const p = [...prev];
              p[index] = 0;
              return p;
            });
          }, 1500);
        }

        return next;
      });
    }, 50);
    balloonIntervalRef.current[index] = interval;
  };

  const handleBalloonEnd = (index: number) => () => {
    // Stop inflating on release (deflate)
    if (balloonIntervalRef.current[index]) {
      clearInterval(balloonIntervalRef.current[index]!);
      balloonIntervalRef.current[index] = null;
    }
    // Slowly deflate if not popped
    if (!balloonPopped[index]) {
      const deflate = setInterval(() => {
        setBalloonProgress((prev) => {
          const next = [...prev];
          next[index] = Math.max(0, next[index] - 0.03);
          if (next[index] <= 0) clearInterval(deflate);
          return next;
        });
      }, 50);
    }
  };

  // ── Slider demo state ──
  const [slider1, setSlider1] = useState(50);
  const [slider2, setSlider2] = useState(50);
  const [slider3, setSlider3] = useState(50);
  const slider1TickRef = useRef(5);
  const slider2TickRef = useRef(5);
  const slider3TickRef = useRef(5);
  // Track layout: store left edge and width per slider
  const sliderTrackRefs = useRef<Record<number, { left: number; width: number }>>({
    1: { left: 0, width: 300 },
    2: { left: 0, width: 300 },
    3: { left: 0, width: 300 },
  });

  const quickTickPattern: Pattern = { discretePattern: [{ time: 0, amplitude: 1, frequency: 1 }, { time: 40, amplitude: 0, frequency: 1 }], continuousPattern: { amplitude: [], frequency: [] } };
  const softTickPattern: Pattern = { discretePattern: [{ time: 0, amplitude: 0.6, frequency: 0.4 }, { time: 60, amplitude: 0, frequency: 0.4 }], continuousPattern: { amplitude: [], frequency: [] } };
  const deepTickPattern: Pattern = { discretePattern: [{ time: 0, amplitude: 0.8, frequency: 0.2 }, { time: 80, amplitude: 0, frequency: 0.2 }], continuousPattern: { amplitude: [], frequency: [] } };

  const quickTickComposer = usePatternComposer();
  const softTickComposer = usePatternComposer();
  const deepTickComposer = usePatternComposer();

  const THUMB_SIZE = 30;
  const TRACK_PADDING = 5; // matches slider-track-container padding-left/right

  // Store track layout from bindlayoutchange
  const handleSliderLayout = (sliderNum: number) => (e: any) => {
    const layout = e?.detail || e;
    if (layout && layout.width) {
      sliderTrackRefs.current[sliderNum] = { left: layout.x || 0, width: layout.width };
    }
  };

  // Helper: compute thumb left (px) from percentage, accounting for thumb width
  const thumbLeft = (pct: number, sliderNum: number): string => {
    const track = sliderTrackRefs.current[sliderNum];
    if (!track || !track.width) return (pct + "%");
    const trackInner = track.width - TRACK_PADDING * 2;
    const px = TRACK_PADDING + (pct / 100) * (trackInner - THUMB_SIZE);
    return px + "px";
  };

  // Compute % from touch relative to track
  const handleSliderMove = (sliderNum: number) => (e: any) => {
    const touch = e.changedTouches?.[0] || e.touches?.[0];
    if (!touch) return;
    const track = sliderTrackRefs.current[sliderNum];
    if (!track || !track.width) return;
    // Subtract padding to get position within actual track area
    const trackInner = track.width - TRACK_PADDING * 2;
    const localX = (touch.offsetX !== undefined ? touch.offsetX : touch.pageX - track.left) - TRACK_PADDING;
    const raw = (localX / trackInner) * 100;
    const pct = Math.max(0, Math.min(100, Math.round(raw)));
    const tick = Math.floor(pct / 10);

    if (sliderNum === 1) {
      setSlider1(pct);
      if (tick !== slider1TickRef.current) { slider1TickRef.current = tick; quickTickComposer.play(); }
    } else if (sliderNum === 2) {
      setSlider2(pct);
      if (tick !== slider2TickRef.current) { slider2TickRef.current = tick; softTickComposer.play(); }
    } else {
      setSlider3(pct);
      if (tick !== slider3TickRef.current) { slider3TickRef.current = tick; deepTickComposer.play(); }
    }
  };

  // ── Dot Loader demo state ──
  const dotLoaderActiveRef = useRef(false);
  const dotHapticTimersRef = useRef<{ timeouts: ReturnType<typeof setTimeout>[]; intervals: ReturnType<typeof setInterval>[] }>({ timeouts: [], intervals: [] });

  // Dot loader patterns (exact from original)
  const dotPattern1: Pattern = { discretePattern: [{ time: 0, amplitude: 0.8, frequency: 0.9 }, { time: 40, amplitude: 0, frequency: 0.9 }], continuousPattern: { amplitude: [], frequency: [] } };
  const dotPattern2: Pattern = { discretePattern: [{ time: 0, amplitude: 0.6, frequency: 0.6 }, { time: 50, amplitude: 0, frequency: 0.6 }], continuousPattern: { amplitude: [], frequency: [] } };
  const dotPattern3: Pattern = { discretePattern: [{ time: 0, amplitude: 0.7, frequency: 0.8 }, { time: 45, amplitude: 0, frequency: 0.8 }], continuousPattern: { amplitude: [], frequency: [] } };

  const dotComposer1 = usePatternComposer();
  const dotComposer2 = usePatternComposer();
  const dotComposer3 = usePatternComposer();

  const CYCLE = 1500;
  const DOT_DELAY = 220;
  const BOTTOM_HIT_RATIO = 0.21;

  // Schedule haptic taps when dot loader is active (CSS handles animation)
  useEffect(() => {
    if (activeDemo === "dotloader" && !dotLoaderActiveRef.current) {
      dotLoaderActiveRef.current = true;
      const composers = [dotComposer1, dotComposer2, dotComposer3];
      const timers = dotHapticTimersRef.current;

      // Per-dot haptic scheduling (matches original LoaderDot useEffect)
      composers.forEach((composer, i) => {
        const firstHit = i * DOT_DELAY + CYCLE * BOTTOM_HIT_RATIO;
        const t = setTimeout(() => {
          composer.play();
          const interval = setInterval(() => composer.play(), CYCLE);
          timers.intervals.push(interval);
        }, firstHit);
        timers.timeouts.push(t);
      });

      return () => {
        timers.timeouts.forEach((t) => clearTimeout(t));
        timers.intervals.forEach((t) => clearInterval(t));
        timers.timeouts = [];
        timers.intervals = [];
        dotLoaderActiveRef.current = false;
      };
    }
    if (activeDemo !== "dotloader" && dotLoaderActiveRef.current) {
      const timers = dotHapticTimersRef.current;
      timers.timeouts.forEach((t) => clearTimeout(t));
      timers.intervals.forEach((t) => clearInterval(t));
      timers.timeouts = [];
      timers.intervals = [];
      dotLoaderActiveRef.current = false;
    }
  }, [activeDemo]);

  // ── Notification demo state ──
  const [notifPlaying, setNotifPlaying] = useState(false);
  const [activeNotifIndex, setActiveNotifIndex] = useState(-1);
  const NOTIFICATIONS = [
    { id: "success", title: "Success", message: "Payment received successfully", color: "#10B981", icon: "\u2713", play: Presets.stamp },
    { id: "alert", title: "Alert", message: "Low battery warning", color: "#F59E0B", icon: "!", play: Presets.peal },
    { id: "message", title: "Message", message: "You have a new message", color: "#3B82F6", icon: "\u2709", play: Presets.chime },
    { id: "error", title: "Error", message: "Connection failed", color: "#EF4444", icon: "\u2717", play: Presets.buzz },
    { id: "reminder", title: "Reminder", message: "Meeting starts in 15 minutes", color: "#8B5CF6", icon: "\u23F0", play: Presets.swell },
  ];

  const handlePlayNotifications = () => {
    if (notifPlaying) return;
    setNotifPlaying(true);
    let idx = 0;
    const showNext = () => {
      if (idx >= NOTIFICATIONS.length) {
        setActiveNotifIndex(-1);
        setNotifPlaying(false);
        return;
      }
      setActiveNotifIndex(idx);
      NOTIFICATIONS[idx].play();
      idx++;
      setTimeout(showNext, 1000);
    };
    showNext();
  };

  // ── Countdown demo state ──
  const [countdown, setCountdown] = useState<number | null>(null); // null = ready state
  const [countdownRunning, setCountdownRunning] = useState(false);
  const [countdownAnimKey, setCountdownAnimKey] = useState(0);
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Countdown patterns (exact values from original)
  const tickPattern: Pattern = { discretePattern: [{ time: 0, amplitude: 0.6, frequency: 0.7 }, { time: 30, amplitude: 0, frequency: 0.7 }], continuousPattern: { amplitude: [], frequency: [] } };
  const finalTickPattern: Pattern = { discretePattern: [{ time: 0, amplitude: 0.85, frequency: 0.85 }, { time: 40, amplitude: 0, frequency: 0.85 }], continuousPattern: { amplitude: [], frequency: [] } };
  const completePattern: Pattern = { discretePattern: [{ time: 0, amplitude: 0.9, frequency: 0.5 }, { time: 50, amplitude: 0, frequency: 0.5 }, { time: 100, amplitude: 0.9, frequency: 0.5 }, { time: 150, amplitude: 0, frequency: 0.5 }], continuousPattern: { amplitude: [], frequency: [] } };

  const tickComposer = usePatternComposer();
  const finalTickComposer = usePatternComposer();
  const completeComposer = usePatternComposer();

  const handleStartCountdown = () => {
    if (countdownRunning) {
      // Reset
      if (countdownRef.current) clearInterval(countdownRef.current);
      setCountdownRunning(false);
      setCountdown(null);
      return;
    }
    setCountdown(7);
    setCountdownRunning(true);
    let count = 7;
    countdownRef.current = setInterval(() => {
      count--;
      setCountdown(count);
      setCountdownAnimKey((k) => k + 1); // trigger animation per tick
      if (count > 3) {
        tickComposer.play();
      } else if (count > 0) {
        finalTickComposer.play();
      } else {
        completeComposer.play();
        if (countdownRef.current) clearInterval(countdownRef.current);
        setCountdownRunning(false);
        // Reset to ready state after showing "Complete!"
        setTimeout(() => setCountdown(null), 2000);
      }
    }, 1000);
  };

  // ── Button demo patterns (exact values from original) ──
  const tapPattern: Pattern = { discretePattern: [{ time: 0, amplitude: 1.0, frequency: 1.0 }], continuousPattern: { amplitude: [], frequency: [] } };
  const softPattern: Pattern = { discretePattern: [{ time: 0, amplitude: 0.4, frequency: 0.7 }], continuousPattern: { amplitude: [], frequency: [] } };
  const deepPattern: Pattern = { discretePattern: [{ time: 0, amplitude: 0.9, frequency: 0.1 }], continuousPattern: { amplitude: [], frequency: [] } };
  const doublePattern: Pattern = { discretePattern: [{ time: 0, amplitude: 0.9, frequency: 0.8 }, { time: 60, amplitude: 0.9, frequency: 0.8 }], continuousPattern: { amplitude: [], frequency: [] } };
  const knockPattern: Pattern = { discretePattern: [{ time: 0, amplitude: 1.0, frequency: 0.3 }, { time: 180, amplitude: 0.8, frequency: 0.25 }], continuousPattern: { amplitude: [], frequency: [] } };
  const ripplePattern: Pattern = { discretePattern: [{ time: 0, amplitude: 1.0, frequency: 0.7 }, { time: 70, amplitude: 0.7, frequency: 0.55 }, { time: 140, amplitude: 0.45, frequency: 0.45 }, { time: 210, amplitude: 0.25, frequency: 0.35 }], continuousPattern: { amplitude: [], frequency: [] } };

  const tapComposer = usePatternComposer();
  const softComposer = usePatternComposer();
  const deepComposer = usePatternComposer();
  const doubleComposer = usePatternComposer();
  const knockComposer = usePatternComposer();
  const rippleComposer = usePatternComposer();

  // Parse demo patterns on mount
  useEffect(() => {
    tapComposer.parse(tapPattern);
    softComposer.parse(softPattern);
    deepComposer.parse(deepPattern);
    doubleComposer.parse(doublePattern);
    knockComposer.parse(knockPattern);
    rippleComposer.parse(ripplePattern);
    tickComposer.parse(tickPattern);
    finalTickComposer.parse(finalTickPattern);
    completeComposer.parse(completePattern);
    dotComposer1.parse(dotPattern1);
    dotComposer2.parse(dotPattern2);
    dotComposer3.parse(dotPattern3);
    quickTickComposer.parse(quickTickPattern);
    softTickComposer.parse(softTickPattern);
    deepTickComposer.parse(deepTickPattern);
  }, []);

  // ── Preset playback with progress indicator ──
  const [playingPresetName, setPlayingPresetName] = useState("");
  const [playProgress, setPlayProgress] = useState(0); // 0-100
  const playIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const handlePlayPreset = (preset: PresetMeta) => {
    // If already playing this preset, stop it
    if (playingPresetName === preset.name) {
      if (playIntervalRef.current) clearInterval(playIntervalRef.current);
      setPlayingPresetName("");
      setPlayProgress(0);
      return;
    }
    // Stop any previous playback
    if (playIntervalRef.current) clearInterval(playIntervalRef.current);

    // Start playing
    preset.play();
    setPlayingPresetName(preset.name);
    setPlayProgress(0);

    if (preset.duration > 0) {
      const startTime = Date.now();
      playIntervalRef.current = setInterval(() => {
        const elapsed = Date.now() - startTime;
        const pct = Math.min(100, (elapsed / preset.duration) * 100);
        setPlayProgress(pct);
        if (elapsed >= preset.duration) {
          if (playIntervalRef.current) clearInterval(playIntervalRef.current);
          playIntervalRef.current = null;
          setPlayingPresetName("");
          setPlayProgress(0);
        }
      }, 16); // ~60fps
    } else {
      // No duration — flash briefly
      setTimeout(() => {
        setPlayingPresetName("");
        setPlayProgress(0);
      }, 300);
    }
  };

  const handleAddTag = (tag: string) => {
    if (!selectedTags.includes(tag)) setSelectedTags([...selectedTags, tag]);
  };
  const handleRemoveTag = (tag: string) => setSelectedTags(selectedTags.filter((t) => t !== tag));
  const handleClearTags = () => setSelectedTags([]);

  const handleTabHome = () => setActiveTab("home");
  const handleTabPresets = () => setActiveTab("presets");
  const handleTabPlayground = () => setActiveTab("playground");
  const handleTabDemos = () => { setActiveTab("demos"); setActiveDemo(""); };
  const handleToggleHelp = () => setHelpOpen(!helpOpen);

  return (
    <view className="page">
      <view className="tab-content">
        {/* Home — always in DOM, shown/hidden via display */}
        <view className="tab-panel" style={{ display: activeTab === "home" ? "flex" : "none", flexDirection: "column", zIndex: activeTab === "home" ? 10 : 0 }}>
          <scroll-view scroll-orientation="vertical" style={{ flex: 1 }}>
            <view className="scroll-content">
              {/* Title */}
              <text className="title" style={{ marginTop: "30px", marginBottom: "30px" }}>Welcome to Pulsar!</text>

              {/* Card wrapper — badge overlaps card corner */}
              <view style={{ position: "relative" }}>
                {/* Connection badge — overlaps top-right of card */}
                <view className="conn-badge" style={{ position: "absolute", top: "-12px", right: "-8px", zIndex: 2 }}>
                  <text className="conn-text">{connBadgeText()}</text>
                  <view className="conn-dot" style={{ backgroundColor: connDotColor() }} />
                </view>

                {/* Connect device card */}
                <view className="card">
                  <text className="section-title">Connect device</text>
                  <text className="subtitle" style={{ marginTop: "12px" }}>{connSubtitleText()}</text>

                  {/* Info box — shows connection status */}
                  <view className="info-box" style={{ display: infoBox ? "flex" : "none", marginTop: "16px" }}>
                    <text className="info-box-text" style={{ color: infoBox?.color || "#001A72" }}>{infoBox?.text || ""}</text>
                  </view>

                  {/* Disconnect row — shown when connected/connecting */}
                  <view style={{ display: showDisconnectRow ? "flex" : "none", flexDirection: "row", justifyContent: "space-evenly", marginTop: "16px" }}>
                    <view bindtap={handleDisconnect}>
                      <text className="disconnect-link">Disconnect</text>
                    </view>
                  </view>

                  {/* Connect form — shown when disconnected or error */}
                  <view style={{ display: showConnectForm ? "flex" : "none", flexDirection: "column" }}>
                    <input
                      className="input-field"
                      placeholder="Connecting code"
                      style={{ marginTop: "16px" }}
                      value={connectingCode}
                      bindinput={(e: any) => setConnectingCode(e.detail.value || "")}
                    />

                    <view className="btn" style={{ marginTop: "15px" }} bindtap={handleOnConnect}>
                      <text className="btn-text">{connectionState === "CONNECTING" ? "Connecting..." : "Connect"}</text>
                    </view>

                    {/* Collapsible help — inside the card, inside the connect form */}
                    <view className="collapsible-header" style={{ marginTop: "16px" }} bindtap={handleToggleHelp}>
                      <text className="collapsible-chevron">{helpOpen ? "v" : ">"}</text>
                      <text className="collapsible-title">How to connect a device?</text>
                    </view>

                    <view style={{ height: helpOpen ? "auto" : "0px", overflow: "hidden", flexDirection: "column" }}>
                      <view className="collapsible-body">
                        <view className="collapsible-step">
                          <text className="collapsible-step-num">1.</text>
                          <view style={{ flex: 1 }}>
                            <text className="collapsible-step-text">Open Pulsar documentation on Presets playground and find Device Connection section.</text>
                          </view>
                        </view>
                        <view className="collapsible-step">
                          <text className="collapsible-step-num">2.</text>
                          <view style={{ flex: 1 }}>
                            <text className="collapsible-step-text">Scan QR code or type Pairing code into PulsarApp and click Connect button.</text>
                          </view>
                        </view>
                        <view className="collapsible-step">
                          <text className="collapsible-step-num">3.</text>
                          <view style={{ flex: 1 }}>
                            <text className="collapsible-step-text">Select one of the presets on the website and experience the haptics right on your device.</text>
                          </view>
                        </view>
                      </view>
                    </view>
                  </view>
                </view>
              </view>

              {/* Pattern notification toast */}
              <view className="card" style={{ display: showPatternNotification ? "flex" : "none", marginTop: "16px" }}>
                <text className="section-title">{patternFound ? `${patternName} is playing!` : "Preset not found!"}</text>
              </view>
            </view>
          </scroll-view>
        </view>

        {/* Presets — always in DOM */}
        <view className="tab-panel" style={{ display: activeTab === "presets" ? "flex" : "none", flexDirection: "column", zIndex: activeTab === "presets" ? 10 : 0 }}>
          <scroll-view scroll-orientation="vertical" style={{ flex: 1 }}>
            <view className="scroll-content">
              <text className="title">Get to know Pulsar presets</text>
              <text className="subtitle">Do not spend time creating your own patterns. Just use ours and enjoy the benefits of having haptics in your app. Haptics support: {supportLevel}</text>

              {/* Search */}
              <input
                className="search-input"
                placeholder="Search presets..."
                bindinput={(e: any) => setSearchQuery(e.detail.value || "")}
              />

              {/* Active tag filters */}
              <view style={{ display: selectedTags.length > 0 ? "flex" : "none" }}>
                <view className="tags-row">
                  {selectedTags.map((tag) => (
                    <view key={tag} className="tag-filter" bindtap={() => handleRemoveTag(tag)}>
                      <text className="tag-filter-text">{tag}</text>
                      <text className="tag-filter-x">x</text>
                    </view>
                  ))}
                  <view className="tag-filter" bindtap={handleClearTags}>
                    <text className="tag-filter-text">Clear all</text>
                  </view>
                </view>
              </view>

              {/* Preset cards */}
              {filteredPresets.map((preset) => (
                <view key={preset.name} className="preset-card">
                  <view className="tags-row">
                    {preset.tags.map((tag) => (
                      <view key={tag} className="tag" bindtap={() => handleAddTag(tag)}>
                        <text className="tag-text">{tag}</text>
                      </view>
                    ))}
                  </view>
                  <text className="preset-name">{preset.name}</text>
                  <text className="preset-desc">{preset.description}</text>
                  <view className="preset-image-area" style={{ position: "relative" }}>
                    <image
                      src={presetImages[preset.name] || ""}
                      style={{ width: "350px", height: "160px" }}
                    />
                    {/* Progress indicator bar */}
                    <view
                      className="preset-progress-bar"
                      style={{
                        left: (playingPresetName === preset.name ? playProgress * 3.5 : -10) + "px",
                        opacity: playingPresetName === preset.name ? 1 : 0,
                      }}
                    />
                  </view>
                  <view
                    className="preset-play-btn"
                    bindtap={() => handlePlayPreset(preset)}
                    style={{
                      transform: playingPresetName === preset.name ? "translate(-3px, 3px)" : "translate(0px, 0px)",
                      boxShadow: playingPresetName === preset.name ? "0px 0px 0px #38ACDD" : "-3px 3px 0px #38ACDD",
                    }}
                  >
                    <text className="preset-play-text">{playingPresetName === preset.name ? "Stop \u25A0" : "Play \u25B7"}</text>
                  </view>
                </view>
              ))}

              {/* Empty state */}
              <view style={{ display: filteredPresets.length === 0 ? "flex" : "none" }}>
                <view className="card">
                  <text className="subtitle" style={{ textAlign: "center", marginBottom: 0 }}>No presets match your search or filters</text>
                </view>
              </view>

              <view style={{ height: "40px" }} />
            </view>
          </scroll-view>
        </view>

        {/* Playground — always in DOM */}
        <view className="tab-panel" style={{ display: activeTab === "playground" ? "flex" : "none", flexDirection: "column", zIndex: activeTab === "playground" ? 10 : 0 }}>
          <scroll-view scroll-orientation="vertical" style={{ flex: 1 }}>
            <view className="scroll-content">
              {/* Header */}
              <view style={{ display: "flex", flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                <text className="title" style={{ marginBottom: 0 }}>Playground</text>
                <text style={{ fontSize: "14px", color: "#2B85AB" }}>How does it work?</text>
              </view>

              {/* Gesture grid — explicit height since flex:1 doesn't work reliably */}
              <view
                className="pg-grid"
                bindtouchstart={handlePgTouchStart}
                bindtouchmove={handlePgTouchMove}
                bindtouchend={handlePgTouchEnd}
              >
                <view className="pg-hint">
                  <text className="pg-hint-text">Tap to trigger haptic impulse</text>
                </view>
                <view className="pg-indicator" style={{ left: pgIndicatorX + "px", top: pgIndicatorY + "px" }} />
              </view>

              {/* Timer */}
              <view className="pg-timer-row">
                <text className="pg-timer-label">{pgPlaying ? "Playing" : pgRecording ? "Recording" : pgRecorded ? "Duration" : "Ready"}</text>
                <text className="pg-timer-value">{pgTimerText}</text>
              </view>

              {/* Controls: Play | Record | Download */}
              <view className="pg-controls">
                <view className={`pg-btn-icon ${pgRecorded ? "" : "pg-btn-disabled"}`} bindtap={handlePgPlay}>
                  <text className="pg-btn-icon-text">{pgPlaying ? "\u25A0" : "\u25B6"}</text>
                </view>
                <view className="pg-btn-record" bindtap={handlePgRecord}>
                  <text className="pg-btn-record-text">{pgRecording ? "Stop" : "Record \u25CF"}</text>
                </view>
                <view className={`pg-btn-icon ${pgRecorded ? "" : "pg-btn-disabled"}`}>
                  <text className="pg-btn-icon-text">{"\u2B07"}</text>
                </view>
              </view>
            </view>
          </scroll-view>
        </view>

        {/* Demos — always in DOM */}
        <view className="tab-panel" style={{ display: activeTab === "demos" ? "flex" : "none", flexDirection: "column", zIndex: activeTab === "demos" ? 10 : 0 }}>
          <view className="demo-container">
          {/* Demo Menu */}
          <view className="demo-panel" style={{ display: activeDemo === "" ? "flex" : "none", flexDirection: "column", zIndex: activeDemo === "" ? 10 : 0 }}>
            <scroll-view scroll-orientation="vertical" style={{ flex: 1 }}>
              <view className="scroll-content">
                <text className="title">Haptics demos</text>
                <text className="subtitle">Feel them with real use cases.</text>
                {DEMO_LIST.map((demo) => (
                  <view key={demo.id} className="demo-card" bindtap={() => setActiveDemo(demo.id)}>
                    <text className="demo-card-title">{demo.title}</text>
                    <text className="demo-card-chevron">{">"}</text>
                  </view>
                ))}
                <view style={{ height: "40px" }} />
              </view>
            </scroll-view>
          </view>

          {/* Demo: Buttons */}
          <view className="demo-panel" style={{ display: activeDemo === "buttons" ? "flex" : "none", flexDirection: "column", zIndex: activeDemo === "buttons" ? 10 : 0 }}>
            <scroll-view scroll-orientation="vertical" style={{ flex: 1 }}>
              <view className="scroll-content">
                <view className="back-row" bindtap={handleBackToMenu}><text className="back-text">{"< Back"}</text></view>
                <text className="section-title">Buttons haptics grid</text>
                <text className="subtitle">Tap each button to feel a different haptic pattern.</text>
                <view className="btn-grid">
                  <view className="btn-grid-item"><view className={`btn-grid-btn ${pressedBtn === "tap" ? "btn-grid-btn-pressed" : ""}`} bindtap={() => handleDemoBtnPress("tap", () => tapComposer.play())}><text className="btn-grid-btn-text">Tap</text></view></view>
                  <view className="btn-grid-item"><view className={`btn-grid-btn ${pressedBtn === "soft" ? "btn-grid-btn-pressed" : ""}`} bindtap={() => handleDemoBtnPress("soft", () => softComposer.play())}><text className="btn-grid-btn-text">Soft</text></view></view>
                  <view className="btn-grid-item"><view className={`btn-grid-btn ${pressedBtn === "deep" ? "btn-grid-btn-pressed" : ""}`} bindtap={() => handleDemoBtnPress("deep", () => deepComposer.play())}><text className="btn-grid-btn-text">Deep</text></view></view>
                  <view className="btn-grid-item"><view className={`btn-grid-btn ${pressedBtn === "double" ? "btn-grid-btn-pressed" : ""}`} bindtap={() => handleDemoBtnPress("double", () => doubleComposer.play())}><text className="btn-grid-btn-text">Double</text></view></view>
                  <view className="btn-grid-item"><view className={`btn-grid-btn ${pressedBtn === "knock" ? "btn-grid-btn-pressed" : ""}`} bindtap={() => handleDemoBtnPress("knock", () => knockComposer.play())}><text className="btn-grid-btn-text">Knock</text></view></view>
                  <view className="btn-grid-item"><view className={`btn-grid-btn ${pressedBtn === "ripple" ? "btn-grid-btn-pressed" : ""}`} bindtap={() => handleDemoBtnPress("ripple", () => rippleComposer.play())}><text className="btn-grid-btn-text">Ripple</text></view></view>
                </view>
              </view>
            </scroll-view>
          </view>

          {/* Demo: Countdown Timer */}
          <view className="demo-panel" style={{ display: activeDemo === "countdown" ? "flex" : "none", flexDirection: "column", zIndex: activeDemo === "countdown" ? 10 : 0 }}>
            <scroll-view scroll-orientation="vertical" style={{ flex: 1 }}>
              <view className="scroll-content">
                <view className="back-row" bindtap={handleBackToMenu}><text className="back-text">{"< Back"}</text></view>
                <text className="section-title">Countdown timer</text>
                <text className="subtitle">Experience haptic feedback synced to a countdown timer.</text>

                <view className="countdown-card">
                  <view className="countdown-center">
                    <text
                      key={"cd-" + countdownAnimKey}
                      className={countdown !== null && countdown > 0 && countdown <= 3 ? "countdown-number countdown-number-red" : "countdown-number"}
                      style={countdownAnimKey > 0 ? {
                        animationName: "{ 0% { opacity: 0; transform: scale(0.5) translateY(20px); } 100% { opacity: 1; transform: scale(1) translateY(0px); } }",
                        animationDuration: "300ms",
                        animationTimingFunction: "ease-out",
                      } : undefined}
                    >{countdown !== null ? countdown : "..."}</text>
                  </view>
                  <text className="countdown-status">
                    {countdown === null && !countdownRunning ? "Ready to start" : ""}
                    {countdownRunning && countdown !== null && countdown > 0 ? countdown + " seconds left" : ""}
                    {countdown === 0 && !countdownRunning ? "Complete!" : ""}
                  </text>
                </view>

                <view className="countdown-controls">
                  <view className="btn" bindtap={handleStartCountdown}>
                    <text className="btn-text">{countdown === null ? "Start Countdown" : "Reset"}</text>
                  </view>
                </view>
              </view>
            </scroll-view>
          </view>

          {/* Demo: Notification Haptics */}
          <view className="demo-panel" style={{ display: activeDemo === "notification" ? "flex" : "none", flexDirection: "column", zIndex: activeDemo === "notification" ? 10 : 0 }}>
            <scroll-view scroll-orientation="vertical" style={{ flex: 1 }}>
              <view className="scroll-content">
                <view className="back-row" bindtap={handleBackToMenu}><text className="back-text">{"< Back"}</text></view>
                <text className="section-title">Notification Haptics</text>
                <text className="subtitle">Each notification type has its own unique haptic pattern that matches its intention.</text>

                {/* Notification display — show current notification */}
                <view className="notif-display">
                  {activeNotifIndex >= 0 && activeNotifIndex < NOTIFICATIONS.length ? (
                    <view
                      key={NOTIFICATIONS[activeNotifIndex].id}
                      className="notif-card"
                      style={{
                        animationName: "{ 0% { opacity: 0; transform: translateY(30px); } 70% { opacity: 1; transform: translateY(-5px); } 100% { opacity: 1; transform: translateY(0px); } }",
                        animationDuration: "400ms",
                        animationTimingFunction: "ease-out",
                      }}
                    >
                      <view className="notif-icon-badge" style={{ backgroundColor: NOTIFICATIONS[activeNotifIndex].color }}>
                        <text className="notif-icon-text">{NOTIFICATIONS[activeNotifIndex].icon}</text>
                      </view>
                      <view className="notif-content">
                        <text className="notif-title">{NOTIFICATIONS[activeNotifIndex].title}</text>
                        <text className="notif-message">{NOTIFICATIONS[activeNotifIndex].message}</text>
                      </view>
                    </view>
                  ) : null}
                </view>

                <view className="notif-btn-container">
                  <view className="btn" bindtap={handlePlayNotifications}>
                    <text className="btn-text">{notifPlaying ? "Playing..." : "Play All Notifications"}</text>
                  </view>
                </view>
              </view>
            </scroll-view>
          </view>

          {/* Demo: Dot Loader */}
          <view className="demo-panel" style={{ display: activeDemo === "dotloader" ? "flex" : "none", flexDirection: "column", zIndex: activeDemo === "dotloader" ? 10 : 0 }}>
            <scroll-view scroll-orientation="vertical" style={{ flex: 1 }}>
              <view className="scroll-content">
                <view className="back-row" bindtap={handleBackToMenu}><text className="back-text">{"< Back"}</text></view>
                <text className="section-title">Wavy Dot Loader</text>
                <text className="subtitle">Watch the three dots move in a wave pattern and feel the haptic feedback each time a dot hits the bottom.</text>

                <view className="dot-loader-area">
                  <view className="dot-container">
                    {activeDemo === "dotloader" ? [0, 1, 2].map((i) => (
                      <view key={i} className="dot-wrapper">
                        <view
                          className="dot"
                          style={{ animationDelay: (i * 220) + "ms" }}
                        />
                      </view>
                    )) : null}
                  </view>
                </view>
              </view>
            </scroll-view>
          </view>

          {/* Demo: Haptic Sliders */}
          <view className="demo-panel" style={{ display: activeDemo === "slider" ? "flex" : "none", flexDirection: "column", zIndex: activeDemo === "slider" ? 10 : 0 }}>
            <scroll-view scroll-orientation="vertical" style={{ flex: 1 }}>
              <view className="scroll-content">
                <view className="back-row" bindtap={handleBackToMenu}><text className="back-text">{"< Back"}</text></view>
                <text className="section-title">Slider haptics</text>
                <text className="subtitle">Move each slider to feel different haptic characteristics. Each slider plays a unique haptic feedback when crossing ticks.</text>

                <view className="slider-card">
                  <text className="slider-label">Quick Tick</text>
                  <text className="slider-value">{slider1}%</text>
                  <view className="slider-track-container" bindtouchstart={handleSliderMove(1)} bindtouchmove={handleSliderMove(1)} bindlayoutchange={handleSliderLayout(1)}>
                    <view className="slider-track">
                      <view className="slider-fill" style={{ width: slider1 + "%" }} />
                    </view>
                    <view className="slider-ticks">
                      {[0,1,2,3,4,5,6,7,8,9,10].map((t) => (
                        <view key={t} className={`slider-tick ${t * 10 <= slider1 ? "slider-tick-active" : ""}`} />
                      ))}
                    </view>
                    <view className="slider-thumb" style={{ left: thumbLeft(slider1, 1) }} />
                  </view>
                </view>

                <view className="slider-card">
                  <text className="slider-label">Soft Tick</text>
                  <text className="slider-value">{slider2}%</text>
                  <view className="slider-track-container" bindtouchstart={handleSliderMove(2)} bindtouchmove={handleSliderMove(2)} bindlayoutchange={handleSliderLayout(2)}>
                    <view className="slider-track">
                      <view className="slider-fill" style={{ width: slider2 + "%" }} />
                    </view>
                    <view className="slider-ticks">
                      {[0,1,2,3,4,5,6,7,8,9,10].map((t) => (
                        <view key={t} className={`slider-tick ${t * 10 <= slider2 ? "slider-tick-active" : ""}`} />
                      ))}
                    </view>
                    <view className="slider-thumb" style={{ left: thumbLeft(slider2, 2) }} />
                  </view>
                </view>

                <view className="slider-card">
                  <text className="slider-label">Deep Tick</text>
                  <text className="slider-value">{slider3}%</text>
                  <view className="slider-track-container" bindtouchstart={handleSliderMove(3)} bindtouchmove={handleSliderMove(3)} bindlayoutchange={handleSliderLayout(3)}>
                    <view className="slider-track">
                      <view className="slider-fill" style={{ width: slider3 + "%" }} />
                    </view>
                    <view className="slider-ticks">
                      {[0,1,2,3,4,5,6,7,8,9,10].map((t) => (
                        <view key={t} className={`slider-tick ${t * 10 <= slider3 ? "slider-tick-active" : ""}`} />
                      ))}
                    </view>
                    <view className="slider-thumb" style={{ left: thumbLeft(slider3, 3) }} />
                  </view>
                </view>
              </view>
            </scroll-view>
          </view>

          {/* Demo: Balloon Pop */}
          <view className="demo-panel" style={{ display: activeDemo === "balloon" ? "flex" : "none", flexDirection: "column", zIndex: activeDemo === "balloon" ? 10 : 0 }}>
            <scroll-view scroll-orientation="vertical" style={{ flex: 1 }}>
              <view className="scroll-content">
                <view className="back-row" bindtap={handleBackToMenu}><text className="back-text">{"< Back"}</text></view>
                <text className="section-title">Balloon Pop</text>
                <text className="subtitle">Hold to inflate, release to deflate. Keep holding until it pops!</text>

                <view className="balloon-grid">
                  {[0, 1, 2, 3].map((i) => (
                    <view
                      key={i}
                      className="balloon-cell"
                      bindtouchstart={handleBalloonStart(i)}
                      bindtouchend={handleBalloonEnd(i)}
                    >
                      {balloonPopped[i] ? (
                        <text className="balloon-popped">{"\u{1F4A5}"}</text>
                      ) : (
                        <view style={{ alignItems: "center" }}>
                          <text className="balloon-emoji" style={{ transform: `scale(${0.5 + balloonProgress[i] * 0.8})` }}>{"\u{1F388}"}</text>
                          <text className="balloon-hint">{Math.round(balloonProgress[i] * 100)}%</text>
                        </view>
                      )}
                    </view>
                  ))}
                </view>
              </view>
            </scroll-view>
          </view>

          {/* Demo: Sensor Haptics */}
          <view className="demo-panel" style={{ display: activeDemo === "sensor" ? "flex" : "none", flexDirection: "column", zIndex: activeDemo === "sensor" ? 10 : 0 }}>
            <view style={{ flex: 1, paddingTop: "60px", paddingLeft: "20px", paddingRight: "20px", paddingBottom: "20px", display: "flex", flexDirection: "column" }}>
              <view className="back-row" bindtap={handleBackToMenu}><text className="back-text">{"< Back"}</text></view>
              <text className="section-title">Sensor Haptics</text>
              <text className="subtitle">Drag the dot inside the circle. Feel haptics on movement and boundary collision.</text>

              <view className="sensor-container">
                <view
                  className="sensor-circle"
                  bindtouchstart={handleSensorTouch}
                  bindtouchmove={handleSensorTouch}
                >
                  <view className="sensor-dot" style={{ left: sensorDotX + "px", top: sensorDotY + "px" }} />
                </view>
              </view>

              <text className="sensor-fallback-hint">Touch fallback mode — drag to interact</text>
              <text className="sensor-note">Accelerometer API is not yet available in Lynx. The original app uses device tilt to drive the dot position with physics-based velocity, damping, and elastic boundary collision.</text>
            </view>
          </view>
          </view>{/* close demo-container */}
        </view>
      </view>

      {/* Bottom Tab Bar */}
      <view className="tab-bar">
        {/* Home tab hidden — "Connect device" needs WebSocket, not yet supported in Lynx.
            Restore by uncommenting and flipping the default activeTab back to "home".
        <view className={`tab ${activeTab === "home" ? "tab-active" : ""}`} bindtap={handleTabHome}>
          <image src={activeTab === "home" ? iconHomeActive : iconHomeInactive} style={{ width: "24px", height: "24px" }} />
          <text className={`tab-label ${activeTab === "home" ? "tab-label-active" : ""}`}>Home</text>
        </view>
        */}
        <view className={`tab ${activeTab === "presets" ? "tab-active" : ""}`} bindtap={handleTabPresets}>
          <image src={activeTab === "presets" ? iconListActive : iconListInactive} style={{ width: "24px", height: "24px" }} />
          <text className={`tab-label ${activeTab === "presets" ? "tab-label-active" : ""}`}>Presets</text>
        </view>
        <view className={`tab ${activeTab === "playground" ? "tab-active" : ""}`} bindtap={handleTabPlayground}>
          <image src={activeTab === "playground" ? iconBrushActive : iconBrushInactive} style={{ width: "24px", height: "24px" }} />
          <text className={`tab-label ${activeTab === "playground" ? "tab-label-active" : ""}`}>Playground</text>
        </view>
        <view className={`tab ${activeTab === "demos" ? "tab-active" : ""}`} bindtap={handleTabDemos}>
          <image src={activeTab === "demos" ? iconSparklesActive : iconSparklesInactive} style={{ width: "24px", height: "24px" }} />
          <text className={`tab-label ${activeTab === "demos" ? "tab-label-active" : ""}`}>Demos</text>
        </view>
      </view>
    </view>
  );
}
