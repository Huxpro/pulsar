import { useState, useEffect, useRef } from "@lynx-js/react";
import { Presets, Settings, usePatternComposer } from "lynx-pulsar";
import type { Pattern } from "lynx-pulsar";
import { ALL_PRESETS } from "./presetData.js";
import type { PresetMeta } from "./presetData.js";
import presetImages from "./presetImages.js";
import "./App.css";

export function App() {
  const [activeTab, setActiveTab] = useState<string>("home");
  const [helpOpen, setHelpOpen] = useState(false);

  // ── Presets state ──
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [supportLevel, setSupportLevel] = useState("Unknown");

  useEffect(() => {
    const level = Settings.getHapticsSupportLevel();
    const labels: Record<number, string> = { 0: "None", 1: "Minimal", 2: "Limited", 3: "Standard", 4: "Advanced" };
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
    { id: "buttons", title: "Haptic Buttons" },
    { id: "countdown", title: "Countdown Timer" },
    { id: "notification", title: "Notification Haptics" },
    { id: "dotloader", title: "Dot Loader" },
    { id: "slider", title: "Haptic Sliders" },
    { id: "balloon", title: "Balloon Pop" },
    { id: "sensor", title: "Sensor Haptics" },
  ];
  const handleBackToMenu = () => setActiveDemo("");

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
  const slider1TickRef = useRef(5); // current tick mark (0-10)
  const slider2TickRef = useRef(5);
  const slider3TickRef = useRef(5);

  // Slider patterns (exact from original)
  const quickTickPattern: Pattern = { discretePattern: [{ time: 0, amplitude: 1, frequency: 1 }, { time: 40, amplitude: 0, frequency: 1 }], continuousPattern: { amplitude: [], frequency: [] } };
  const softTickPattern: Pattern = { discretePattern: [{ time: 0, amplitude: 0.6, frequency: 0.4 }, { time: 60, amplitude: 0, frequency: 0.4 }], continuousPattern: { amplitude: [], frequency: [] } };
  const deepTickPattern: Pattern = { discretePattern: [{ time: 0, amplitude: 0.8, frequency: 0.2 }, { time: 80, amplitude: 0, frequency: 0.2 }], continuousPattern: { amplitude: [], frequency: [] } };

  const quickTickComposer = usePatternComposer();
  const softTickComposer = usePatternComposer();
  const deepTickComposer = usePatternComposer();

  // Slider touch: compute % from horizontal position within track
  // Track has 15px left padding in the card + 20px scroll-content padding = 35px offset
  // Track width ≈ screen width - 70px (20px padding each side + 15px card padding each side)
  const handleSliderMove = (sliderNum: number) => (e: any) => {
    const touch = e.changedTouches?.[0] || e.touches?.[0];
    if (!touch) return;
    // Estimate track bounds: left edge ~35px, right edge ~screen-35px
    // Use pageX relative to approximate track position
    const trackLeft = 35;
    const trackWidth = 320; // approximate for most phones
    const raw = ((touch.pageX - trackLeft) / trackWidth) * 100;
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
  const [dotOffsets, setDotOffsets] = useState([0, 0, 0]);
  const dotLoaderRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const dotLoaderActiveRef = useRef(false);

  // Dot loader patterns (exact from original)
  const dotPattern1: Pattern = { discretePattern: [{ time: 0, amplitude: 0.8, frequency: 0.9 }, { time: 40, amplitude: 0, frequency: 0.9 }], continuousPattern: { amplitude: [], frequency: [] } };
  const dotPattern2: Pattern = { discretePattern: [{ time: 0, amplitude: 0.6, frequency: 0.6 }, { time: 50, amplitude: 0, frequency: 0.6 }], continuousPattern: { amplitude: [], frequency: [] } };
  const dotPattern3: Pattern = { discretePattern: [{ time: 0, amplitude: 0.7, frequency: 0.8 }, { time: 45, amplitude: 0, frequency: 0.8 }], continuousPattern: { amplitude: [], frequency: [] } };

  const dotComposer1 = usePatternComposer();
  const dotComposer2 = usePatternComposer();
  const dotComposer3 = usePatternComposer();

  const CYCLE = 1500;
  const DOT_DELAY = 220;
  const WAVE_HEIGHT = 30;

  // Start/stop dot loader when demo is active
  useEffect(() => {
    if (activeDemo === "dotloader" && !dotLoaderActiveRef.current) {
      dotLoaderActiveRef.current = true;
      const startTime = Date.now();

      // Schedule haptic taps at bottom-hit points
      const hitRatio = 0.21;
      const hitTime = CYCLE * hitRatio;
      // First round of haptics
      setTimeout(() => dotComposer1.play(), hitTime);
      setTimeout(() => dotComposer2.play(), hitTime + DOT_DELAY);
      setTimeout(() => dotComposer3.play(), hitTime + DOT_DELAY * 2);
      // Repeating haptics
      const hapticInterval = setInterval(() => {
        dotComposer1.play();
        setTimeout(() => dotComposer2.play(), DOT_DELAY);
        setTimeout(() => dotComposer3.play(), DOT_DELAY * 2);
      }, CYCLE);

      // Animate dot positions at 30fps
      const animInterval = setInterval(() => {
        const now = Date.now() - startTime;
        const offsets = [0, 1, 2].map((i) => {
          const t = (now - i * DOT_DELAY) % CYCLE;
          const phase = (t / CYCLE) * Math.PI * 2;
          // Sine wave: negative = up, positive = down. Peak at bottom.
          return Math.sin(phase) * WAVE_HEIGHT * -1;
        });
        setDotOffsets(offsets);
      }, 33);

      dotLoaderRef.current = animInterval;

      return () => {
        clearInterval(animInterval);
        clearInterval(hapticInterval);
        dotLoaderActiveRef.current = false;
      };
    }
    if (activeDemo !== "dotloader" && dotLoaderActiveRef.current) {
      if (dotLoaderRef.current) clearInterval(dotLoaderRef.current);
      dotLoaderActiveRef.current = false;
    }
  }, [activeDemo]);

  // ── Notification demo state ──
  const [notifPlaying, setNotifPlaying] = useState(false);
  const [activeNotifIndex, setActiveNotifIndex] = useState(-1);
  const NOTIFICATIONS = [
    { id: "success", emoji: "\u2713", title: "Success", message: "Payment received successfully", color: "#10B981", play: Presets.stamp },
    { id: "alert", emoji: "!", title: "Alert", message: "Low battery warning", color: "#F59E0B", play: Presets.peal },
    { id: "message", emoji: "\u2709", title: "Message", message: "You have a new message", color: "#3B82F6", play: Presets.chime },
    { id: "error", emoji: "\u2717", title: "Error", message: "Connection failed", color: "#EF4444", play: Presets.buzz },
    { id: "reminder", emoji: "\u25C9", title: "Reminder", message: "Meeting starts in 15 minutes", color: "#8B5CF6", play: Presets.swell },
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
      setTimeout(showNext, 1200);
    };
    showNext();
  };

  // ── Countdown demo state ──
  const [countdown, setCountdown] = useState(7);
  const [countdownRunning, setCountdownRunning] = useState(false);
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Countdown patterns (exact values from original)
  const tickPattern: Pattern = { discretePattern: [{ time: 0, amplitude: 0.6, frequency: 0.7 }, { time: 30, amplitude: 0, frequency: 0.7 }], continuousPattern: { amplitude: [], frequency: [] } };
  const finalTickPattern: Pattern = { discretePattern: [{ time: 0, amplitude: 0.85, frequency: 0.85 }, { time: 40, amplitude: 0, frequency: 0.85 }], continuousPattern: { amplitude: [], frequency: [] } };
  const completePattern: Pattern = { discretePattern: [{ time: 0, amplitude: 0.9, frequency: 0.5 }, { time: 50, amplitude: 0, frequency: 0.5 }, { time: 100, amplitude: 0.9, frequency: 0.5 }, { time: 150, amplitude: 0, frequency: 0.5 }], continuousPattern: { amplitude: [], frequency: [] } };

  const tickComposer = usePatternComposer();
  const finalTickComposer = usePatternComposer();
  const completeComposer = usePatternComposer();

  const handleStartCountdown = () => {
    if (countdownRunning) return;
    setCountdown(7);
    setCountdownRunning(true);
    let count = 7;
    countdownRef.current = setInterval(() => {
      count--;
      setCountdown(count);
      if (count > 3) {
        tickComposer.play();
      } else if (count > 0) {
        finalTickComposer.play();
      } else {
        completeComposer.play();
        if (countdownRef.current) clearInterval(countdownRef.current);
        setCountdownRunning(false);
        // Reset after 2 seconds
        setTimeout(() => setCountdown(7), 2000);
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

  const handleAddTag = (tag: string) => {
    if (!selectedTags.includes(tag)) setSelectedTags([...selectedTags, tag]);
  };
  const handleRemoveTag = (tag: string) => setSelectedTags(selectedTags.filter((t) => t !== tag));
  const handleClearTags = () => setSelectedTags([]);
  const handlePlayPreset = (preset: PresetMeta) => { preset.play(); };

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
              {/* Title row with badge */}
              <view style={{ display: "flex", flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" }}>
                <text className="title">Welcome to Pulsar!</text>
                <view className="conn-badge">
                  <text className="conn-text">Not connected</text>
                  <view className="conn-dot" />
                </view>
              </view>

              {/* Connect device card */}
              <view className="card" style={{ marginTop: "24px" }}>
                <text className="section-title">Connect device</text>
                <text className="subtitle">Connect your haptic device first. Pair it with the app now so you can test the presets.</text>

                <input className="input-field" placeholder="Connecting code" />

                <view className="btn" style={{ marginTop: "15px" }}>
                  <text className="btn-text">Connect</text>
                </view>
              </view>

              {/* Collapsible help section */}
              <view className="collapsible-header" bindtap={handleToggleHelp}>
                <text className="collapsible-chevron">{helpOpen ? "v" : ">"}</text>
                <text className="collapsible-title">How to connect a device?</text>
              </view>

              <view style={{ display: helpOpen ? "flex" : "none" }}>
                <view className="collapsible-body">
                  <view className="collapsible-step">
                    <text className="collapsible-step-num">1.</text>
                    <text className="collapsible-step-text">Open Pulsar documentation on Presets playground and find Device Connection section.</text>
                  </view>
                  <view className="collapsible-step">
                    <text className="collapsible-step-num">2.</text>
                    <text className="collapsible-step-text">Scan QR code or type Pairing code into PulsarApp and click Connect button.</text>
                  </view>
                  <view className="collapsible-step">
                    <text className="collapsible-step-num">3.</text>
                    <text className="collapsible-step-text">Select one of the presets on the website and experience the haptics right on your device.</text>
                  </view>
                </view>
              </view>
            </view>
          </scroll-view>
        </view>

        {/* Presets — always in DOM */}
        <view className="tab-panel" style={{ display: activeTab === "presets" ? "flex" : "none", flexDirection: "column", zIndex: activeTab === "presets" ? 10 : 0 }}>
          <scroll-view scroll-orientation="vertical" style={{ flex: 1 }}>
            <view className="scroll-content">
              <text className="title">Get to know Pulsar presets</text>
              <text className="subtitle">Don't spend time creating your own patterns. Just use ours and enjoy the benefits of having haptics in your app. Haptics support: {supportLevel}</text>

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
                  <view className="preset-image-area">
                    <image
                      src={presetImages[preset.name] || ""}
                      style={{ width: "350px", height: "160px" }}
                    />
                  </view>
                  <view className="preset-play-btn" bindtap={() => handlePlayPreset(preset)}>
                    <text className="preset-play-text">Play {"\u25B7"}</text>
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
                <text className="section-title">Haptic Buttons</text>
                <text className="subtitle">Each button triggers a different haptic pattern</text>
                <view className="btn-grid">
                  <view className="btn-grid-item"><view className="btn-grid-btn" bindtap={() => tapComposer.play()}><text className="btn-grid-btn-text">Tap</text></view></view>
                  <view className="btn-grid-item"><view className="btn-grid-btn" bindtap={() => softComposer.play()}><text className="btn-grid-btn-text">Soft</text></view></view>
                  <view className="btn-grid-item"><view className="btn-grid-btn" bindtap={() => deepComposer.play()}><text className="btn-grid-btn-text">Deep</text></view></view>
                  <view className="btn-grid-item"><view className="btn-grid-btn" bindtap={() => doubleComposer.play()}><text className="btn-grid-btn-text">Double</text></view></view>
                  <view className="btn-grid-item"><view className="btn-grid-btn" bindtap={() => knockComposer.play()}><text className="btn-grid-btn-text">Knock</text></view></view>
                  <view className="btn-grid-item"><view className="btn-grid-btn" bindtap={() => rippleComposer.play()}><text className="btn-grid-btn-text">Ripple</text></view></view>
                </view>
              </view>
            </scroll-view>
          </view>

          {/* Demo: Countdown Timer */}
          <view className="demo-panel" style={{ display: activeDemo === "countdown" ? "flex" : "none", flexDirection: "column", zIndex: activeDemo === "countdown" ? 10 : 0 }}>
            <view style={{ flex: 1, paddingTop: "60px", paddingLeft: "20px", paddingRight: "20px", paddingBottom: "20px", display: "flex", flexDirection: "column" }}>
              <view className="back-row" bindtap={handleBackToMenu}><text className="back-text">{"< Back"}</text></view>
              <text className="section-title">Countdown Timer</text>
              <text className="subtitle">Haptic ticks intensify as the countdown nears zero</text>
              <view className="countdown-center">
                <text className={countdown <= 3 && countdownRunning ? "countdown-number countdown-number-red" : "countdown-number"}>{countdown}</text>
              </view>
              <text className="countdown-status">{countdownRunning ? "Counting down..." : countdown === 0 ? "Complete!" : "Ready"}</text>
              <view className="btn" bindtap={handleStartCountdown}>
                <text className="btn-text">{countdownRunning ? "Running..." : "Start"}</text>
              </view>
            </view>
          </view>

          {/* Demo: Notification Haptics */}
          <view className="demo-panel" style={{ display: activeDemo === "notification" ? "flex" : "none", flexDirection: "column", zIndex: activeDemo === "notification" ? 10 : 0 }}>
            <scroll-view scroll-orientation="vertical" style={{ flex: 1 }}>
              <view className="scroll-content">
                <view className="back-row" bindtap={handleBackToMenu}><text className="back-text">{"< Back"}</text></view>
                <text className="section-title">Notification Haptics</text>
                <text className="subtitle">Each notification type has a matching haptic pattern</text>

                <view className="btn" style={{ marginBottom: "24px" }} bindtap={handlePlayNotifications}>
                  <text className="btn-text">{notifPlaying ? "Playing..." : "Play All Notifications"}</text>
                </view>

                {NOTIFICATIONS.map((notif, idx) => (
                  <view
                    key={notif.id}
                    className="notif-card"
                    style={{
                      borderLeftColor: notif.color,
                      opacity: activeNotifIndex === -1 ? 1 : activeNotifIndex === idx ? 1 : 0.3,
                    }}
                  >
                    <text className="notif-title">{notif.emoji} {notif.title}</text>
                    <text className="notif-message">{notif.message}</text>
                  </view>
                ))}
              </view>
            </scroll-view>
          </view>

          {/* Demo: Dot Loader */}
          <view className="demo-panel" style={{ display: activeDemo === "dotloader" ? "flex" : "none", flexDirection: "column", zIndex: activeDemo === "dotloader" ? 10 : 0 }}>
            <view style={{ flex: 1, paddingTop: "60px", paddingLeft: "20px", paddingRight: "20px", paddingBottom: "20px", display: "flex", flexDirection: "column" }}>
              <view className="back-row" bindtap={handleBackToMenu}><text className="back-text">{"< Back"}</text></view>
              <text className="section-title">Dot Loader</text>
              <text className="subtitle">Each dot triggers a haptic tap at the bottom of its bounce</text>
              <view style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <view className="dot-container">
                  <view className="dot" style={{ transform: `translateY(${dotOffsets[0]}px)` }} />
                  <view className="dot" style={{ transform: `translateY(${dotOffsets[1]}px)` }} />
                  <view className="dot" style={{ transform: `translateY(${dotOffsets[2]}px)` }} />
                </view>
              </view>
            </view>
          </view>

          {/* Demo: Haptic Sliders */}
          <view className="demo-panel" style={{ display: activeDemo === "slider" ? "flex" : "none", flexDirection: "column", zIndex: activeDemo === "slider" ? 10 : 0 }}>
            <scroll-view scroll-orientation="vertical" style={{ flex: 1 }}>
              <view className="scroll-content">
                <view className="back-row" bindtap={handleBackToMenu}><text className="back-text">{"< Back"}</text></view>
                <text className="section-title">Haptic Sliders</text>
                <text className="subtitle">Drag to feel haptic ticks at each 10% mark</text>

                <view className="slider-card">
                  <text className="slider-label">Quick Tick</text>
                  <text className="slider-value">{slider1}%</text>
                  <view
                    className="slider-track"
                    bindtouchstart={handleSliderMove(1)}
                    bindtouchmove={handleSliderMove(1)}
                  >
                    <view className="slider-fill" style={{ width: slider1 + "%" }} />
                    <view className="slider-thumb" style={{ left: slider1 + "%" }} />
                  </view>
                </view>

                <view className="slider-card">
                  <text className="slider-label">Soft Tick</text>
                  <text className="slider-value">{slider2}%</text>
                  <view
                    className="slider-track"
                    bindtouchstart={handleSliderMove(2)}
                    bindtouchmove={handleSliderMove(2)}
                  >
                    <view className="slider-fill" style={{ width: slider2 + "%" }} />
                    <view className="slider-thumb" style={{ left: slider2 + "%" }} />
                  </view>
                </view>

                <view className="slider-card">
                  <text className="slider-label">Deep Tick</text>
                  <text className="slider-value">{slider3}%</text>
                  <view
                    className="slider-track"
                    bindtouchstart={handleSliderMove(3)}
                    bindtouchmove={handleSliderMove(3)}
                  >
                    <view className="slider-fill" style={{ width: slider3 + "%" }} />
                    <view className="slider-thumb" style={{ left: slider3 + "%" }} />
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
                      <view style={{ display: balloonPopped[i] ? "none" : "flex", alignItems: "center" }}>
                        <text className="balloon-emoji" style={{ transform: `scale(${0.5 + balloonProgress[i] * 0.8})` }}>{"\u{1F388}"}</text>
                        <text className="balloon-hint">{Math.round(balloonProgress[i] * 100)}%</text>
                      </view>
                      <view style={{ display: balloonPopped[i] ? "flex" : "none", alignItems: "center" }}>
                        <text className="balloon-popped">POP!</text>
                      </view>
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
        <view className={`tab ${activeTab === "home" ? "tab-active" : ""}`} bindtap={handleTabHome}>
          <text className={`tab-label ${activeTab === "home" ? "tab-label-active" : ""}`}>Home</text>
        </view>
        <view className={`tab ${activeTab === "presets" ? "tab-active" : ""}`} bindtap={handleTabPresets}>
          <text className={`tab-label ${activeTab === "presets" ? "tab-label-active" : ""}`}>Presets</text>
        </view>
        <view className={`tab ${activeTab === "playground" ? "tab-active" : ""}`} bindtap={handleTabPlayground}>
          <text className={`tab-label ${activeTab === "playground" ? "tab-label-active" : ""}`}>Playground</text>
        </view>
        <view className={`tab ${activeTab === "demos" ? "tab-active" : ""}`} bindtap={handleTabDemos}>
          <text className={`tab-label ${activeTab === "demos" ? "tab-label-active" : ""}`}>Demos</text>
        </view>
      </view>
    </view>
  );
}
