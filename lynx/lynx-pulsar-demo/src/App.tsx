import { useState, useEffect } from "@lynx-js/react";
import { Presets, Settings, HapticSupport, usePatternComposer } from "lynx-pulsar";
import type { Pattern } from "lynx-pulsar";
import "./App.css";

// ─── Preset Data ────────────────────────────────────────────────────────────

interface PresetItem {
  name: string;
  displayName: string;
  play: () => void;
}

const PRESETS: PresetItem[] = [
  { name: "SystemImpactLight", displayName: "\u{1F4AB} Impact Light", play: Presets.System.impactLight },
  { name: "SystemImpactMedium", displayName: "\u26A1 Impact Medium", play: Presets.System.impactMedium },
  { name: "SystemImpactHeavy", displayName: "\u{1F4A5} Impact Heavy", play: Presets.System.impactHeavy },
  { name: "SystemImpactSoft", displayName: "\u{1F338} Impact Soft", play: Presets.System.impactSoft },
  { name: "SystemImpactRigid", displayName: "\u{1F528} Impact Rigid", play: Presets.System.impactRigid },
  { name: "SystemNotificationSuccess", displayName: "\u{1F514} Notification Success", play: Presets.System.notificationSuccess },
  { name: "SystemNotificationWarning", displayName: "\u26A0\uFE0F Notification Warning", play: Presets.System.notificationWarning },
  { name: "SystemNotificationError", displayName: "\u{1F6A8} Notification Error", play: Presets.System.notificationError },
  { name: "SystemSelection", displayName: "\u{1F3AF} Selection", play: Presets.System.selection },
  { name: "Afterglow", displayName: "\u{1F4F3} Afterglow", play: Presets.afterglow },
  { name: "Aftershock", displayName: "\u{1F4F3} Aftershock", play: Presets.aftershock },
  { name: "Alarm", displayName: "\u{1F4F3} Alarm", play: Presets.alarm },
  { name: "Anvil", displayName: "\u{1F4F3} Anvil", play: Presets.anvil },
  { name: "Applause", displayName: "\u{1F4F3} Applause", play: Presets.applause },
  { name: "Ascent", displayName: "\u{1F4F3} Ascent", play: Presets.ascent },
  { name: "BalloonPop", displayName: "\u{1F4F3} BalloonPop", play: Presets.balloonPop },
  { name: "Barrage", displayName: "\u{1F4F3} Barrage", play: Presets.barrage },
  { name: "BassDrop", displayName: "\u{1F4F3} BassDrop", play: Presets.bassDrop },
  { name: "Batter", displayName: "\u{1F4F3} Batter", play: Presets.batter },
  { name: "BellToll", displayName: "\u{1F4F3} BellToll", play: Presets.bellToll },
  { name: "Blip", displayName: "\u{1F4F3} Blip", play: Presets.blip },
  { name: "Bloom", displayName: "\u{1F4F3} Bloom", play: Presets.bloom },
  { name: "Bongo", displayName: "\u{1F4F3} Bongo", play: Presets.bongo },
  { name: "Boulder", displayName: "\u{1F4F3} Boulder", play: Presets.boulder },
  { name: "BreakingWave", displayName: "\u{1F4F3} BreakingWave", play: Presets.breakingWave },
  { name: "Breath", displayName: "\u{1F4F3} Breath", play: Presets.breath },
  { name: "Buildup", displayName: "\u{1F4F3} Buildup", play: Presets.buildup },
  { name: "Burst", displayName: "\u{1F4F3} Burst", play: Presets.burst },
  { name: "Buzz", displayName: "\u{1F4F3} Buzz", play: Presets.buzz },
  { name: "Cadence", displayName: "\u{1F4F3} Cadence", play: Presets.cadence },
  { name: "CameraShutter", displayName: "\u{1F4F3} CameraShutter", play: Presets.cameraShutter },
  { name: "Canter", displayName: "\u{1F4F3} Canter", play: Presets.canter },
  { name: "Cascade", displayName: "\u{1F4F3} Cascade", play: Presets.cascade },
  { name: "Castanets", displayName: "\u{1F4F3} Castanets", play: Presets.castanets },
  { name: "CatPaw", displayName: "\u{1F4F3} CatPaw", play: Presets.catPaw },
  { name: "Charge", displayName: "\u{1F4F3} Charge", play: Presets.charge },
  { name: "Chime", displayName: "\u{1F4F3} Chime", play: Presets.chime },
  { name: "Chip", displayName: "\u{1F4F3} Chip", play: Presets.chip },
  { name: "Chirp", displayName: "\u{1F4F3} Chirp", play: Presets.chirp },
  { name: "Clamor", displayName: "\u{1F4F3} Clamor", play: Presets.clamor },
  { name: "Clasp", displayName: "\u{1F4F3} Clasp", play: Presets.clasp },
  { name: "Cleave", displayName: "\u{1F4F3} Cleave", play: Presets.cleave },
  { name: "Coil", displayName: "\u{1F4F3} Coil", play: Presets.coil },
  { name: "CoinDrop", displayName: "\u{1F4F3} CoinDrop", play: Presets.coinDrop },
  { name: "CombinationLock", displayName: "\u{1F4F3} CombinationLock", play: Presets.combinationLock },
  { name: "Crescendo", displayName: "\u{1F4F3} Crescendo", play: Presets.crescendo },
  { name: "Dewdrop", displayName: "\u{1F4F3} Dewdrop", play: Presets.dewdrop },
  { name: "Dirge", displayName: "\u{1F4F3} Dirge", play: Presets.dirge },
  { name: "Dissolve", displayName: "\u{1F4F3} Dissolve", play: Presets.dissolve },
  { name: "DogBark", displayName: "\u{1F4F3} DogBark", play: Presets.dogBark },
  { name: "Drone", displayName: "\u{1F4F3} Drone", play: Presets.drone },
  { name: "EngineRev", displayName: "\u{1F4F3} EngineRev", play: Presets.engineRev },
  { name: "Exhale", displayName: "\u{1F4F3} Exhale", play: Presets.exhale },
  { name: "Explosion", displayName: "\u{1F4F3} Explosion", play: Presets.explosion },
  { name: "FadeOut", displayName: "\u{1F4F3} FadeOut", play: Presets.fadeOut },
  { name: "Fanfare", displayName: "\u{1F4F3} Fanfare", play: Presets.fanfare },
  { name: "Feather", displayName: "\u{1F4F3} Feather", play: Presets.feather },
  { name: "Finale", displayName: "\u{1F4F3} Finale", play: Presets.finale },
  { name: "FingerDrum", displayName: "\u{1F4F3} FingerDrum", play: Presets.fingerDrum },
  { name: "Firecracker", displayName: "\u{1F4F3} Firecracker", play: Presets.firecracker },
  { name: "Fizz", displayName: "\u{1F4F3} Fizz", play: Presets.fizz },
  { name: "Flare", displayName: "\u{1F4F3} Flare", play: Presets.flare },
  { name: "Flick", displayName: "\u{1F4F3} Flick", play: Presets.flick },
  { name: "Flinch", displayName: "\u{1F4F3} Flinch", play: Presets.flinch },
  { name: "Flourish", displayName: "\u{1F4F3} Flourish", play: Presets.flourish },
  { name: "Flurry", displayName: "\u{1F4F3} Flurry", play: Presets.flurry },
  { name: "Flush", displayName: "\u{1F4F3} Flush", play: Presets.flush },
  { name: "Gallop", displayName: "\u{1F4F3} Gallop", play: Presets.gallop },
  { name: "Gavel", displayName: "\u{1F4F3} Gavel", play: Presets.gavel },
  { name: "Glitch", displayName: "\u{1F4F3} Glitch", play: Presets.glitch },
  { name: "GuitarStrum", displayName: "\u{1F4F3} GuitarStrum", play: Presets.guitarStrum },
  { name: "Hail", displayName: "\u{1F4F3} Hail", play: Presets.hail },
  { name: "Hammer", displayName: "\u{1F4F3} Hammer", play: Presets.hammer },
  { name: "Heartbeat", displayName: "\u{1F4F3} Heartbeat", play: Presets.heartbeat },
  { name: "Herald", displayName: "\u{1F4F3} Herald", play: Presets.herald },
  { name: "HoofBeat", displayName: "\u{1F4F3} HoofBeat", play: Presets.hoofBeat },
  { name: "Ignition", displayName: "\u{1F4F3} Ignition", play: Presets.ignition },
  { name: "Impact", displayName: "\u{1F4F3} Impact", play: Presets.impact },
  { name: "Jolt", displayName: "\u{1F4F3} Jolt", play: Presets.jolt },
  { name: "KeyboardMechanical", displayName: "\u{1F4F3} KeyboardMechanical", play: Presets.keyboardMechanical },
  { name: "KeyboardMembrane", displayName: "\u{1F4F3} KeyboardMembrane", play: Presets.keyboardMembrane },
  { name: "Knell", displayName: "\u{1F4F3} Knell", play: Presets.knell },
  { name: "Knock", displayName: "\u{1F4F3} Knock", play: Presets.knock },
  { name: "Lament", displayName: "\u{1F4F3} Lament", play: Presets.lament },
  { name: "Latch", displayName: "\u{1F4F3} Latch", play: Presets.latch },
  { name: "Lighthouse", displayName: "\u{1F4F3} Lighthouse", play: Presets.lighthouse },
  { name: "Lilt", displayName: "\u{1F4F3} Lilt", play: Presets.lilt },
  { name: "Lock", displayName: "\u{1F4F3} Lock", play: Presets.lock },
  { name: "Lope", displayName: "\u{1F4F3} Lope", play: Presets.lope },
  { name: "March", displayName: "\u{1F4F3} March", play: Presets.march },
  { name: "Metronome", displayName: "\u{1F4F3} Metronome", play: Presets.metronome },
  { name: "Murmur", displayName: "\u{1F4F3} Murmur", play: Presets.murmur },
  { name: "Nudge", displayName: "\u{1F4F3} Nudge", play: Presets.nudge },
  { name: "PassingCar", displayName: "\u{1F4F3} PassingCar", play: Presets.passingCar },
  { name: "Patter", displayName: "\u{1F4F3} Patter", play: Presets.patter },
  { name: "Peal", displayName: "\u{1F4F3} Peal", play: Presets.peal },
  { name: "Peck", displayName: "\u{1F4F3} Peck", play: Presets.peck },
  { name: "Pendulum", displayName: "\u{1F4F3} Pendulum", play: Presets.pendulum },
  { name: "Ping", displayName: "\u{1F4F3} Ping", play: Presets.ping },
  { name: "Pip", displayName: "\u{1F4F3} Pip", play: Presets.pip },
  { name: "Piston", displayName: "\u{1F4F3} Piston", play: Presets.piston },
  { name: "Plink", displayName: "\u{1F4F3} Plink", play: Presets.plink },
  { name: "Plummet", displayName: "\u{1F4F3} Plummet", play: Presets.plummet },
  { name: "Plunk", displayName: "\u{1F4F3} Plunk", play: Presets.plunk },
  { name: "Poke", displayName: "\u{1F4F3} Poke", play: Presets.poke },
  { name: "Pound", displayName: "\u{1F4F3} Pound", play: Presets.pound },
  { name: "PowerDown", displayName: "\u{1F4F3} PowerDown", play: Presets.powerDown },
  { name: "Propel", displayName: "\u{1F4F3} Propel", play: Presets.propel },
  { name: "Pulse", displayName: "\u{1F4F3} Pulse", play: Presets.pulse },
  { name: "Pummel", displayName: "\u{1F4F3} Pummel", play: Presets.pummel },
  { name: "Push", displayName: "\u{1F4F3} Push", play: Presets.push },
  { name: "Radar", displayName: "\u{1F4F3} Radar", play: Presets.radar },
  { name: "Rain", displayName: "\u{1F4F3} Rain", play: Presets.rain },
  { name: "Ramp", displayName: "\u{1F4F3} Ramp", play: Presets.ramp },
  { name: "Rap", displayName: "\u{1F4F3} Rap", play: Presets.rap },
  { name: "Ratchet", displayName: "\u{1F4F3} Ratchet", play: Presets.ratchet },
  { name: "Rebound", displayName: "\u{1F4F3} Rebound", play: Presets.rebound },
  { name: "Ripple", displayName: "\u{1F4F3} Ripple", play: Presets.ripple },
  { name: "Rivet", displayName: "\u{1F4F3} Rivet", play: Presets.rivet },
  { name: "Rustle", displayName: "\u{1F4F3} Rustle", play: Presets.rustle },
  { name: "Shockwave", displayName: "\u{1F4F3} Shockwave", play: Presets.shockwave },
  { name: "Snap", displayName: "\u{1F4F3} Snap", play: Presets.snap },
  { name: "Sonar", displayName: "\u{1F4F3} Sonar", play: Presets.sonar },
  { name: "Spark", displayName: "\u{1F4F3} Spark", play: Presets.spark },
  { name: "Spin", displayName: "\u{1F4F3} Spin", play: Presets.spin },
  { name: "Stagger", displayName: "\u{1F4F3} Stagger", play: Presets.stagger },
  { name: "Stamp", displayName: "\u{1F4F3} Stamp", play: Presets.stamp },
  { name: "Stampede", displayName: "\u{1F4F3} Stampede", play: Presets.stampede },
  { name: "Stomp", displayName: "\u{1F4F3} Stomp", play: Presets.stomp },
  { name: "StoneSkip", displayName: "\u{1F4F3} StoneSkip", play: Presets.stoneSkip },
  { name: "Strike", displayName: "\u{1F4F3} Strike", play: Presets.strike },
  { name: "Summon", displayName: "\u{1F4F3} Summon", play: Presets.summon },
  { name: "Surge", displayName: "\u{1F4F3} Surge", play: Presets.surge },
  { name: "Sway", displayName: "\u{1F4F3} Sway", play: Presets.sway },
  { name: "Sweep", displayName: "\u{1F4F3} Sweep", play: Presets.sweep },
  { name: "Swell", displayName: "\u{1F4F3} Swell", play: Presets.swell },
  { name: "Syncopate", displayName: "\u{1F4F3} Syncopate", play: Presets.syncopate },
  { name: "Throb", displayName: "\u{1F4F3} Throb", play: Presets.throb },
  { name: "Thud", displayName: "\u{1F4F3} Thud", play: Presets.thud },
  { name: "Thump", displayName: "\u{1F4F3} Thump", play: Presets.thump },
  { name: "Thunder", displayName: "\u{1F4F3} Thunder", play: Presets.thunder },
  { name: "ThunderRoll", displayName: "\u{1F4F3} ThunderRoll", play: Presets.thunderRoll },
  { name: "TickTock", displayName: "\u{1F4F3} TickTock", play: Presets.tickTock },
  { name: "TidalSurge", displayName: "\u{1F4F3} TidalSurge", play: Presets.tidalSurge },
  { name: "TideSwell", displayName: "\u{1F4F3} TideSwell", play: Presets.tideSwell },
  { name: "Tremor", displayName: "\u{1F4F3} Tremor", play: Presets.tremor },
  { name: "Trigger", displayName: "\u{1F4F3} Trigger", play: Presets.trigger },
  { name: "Triumph", displayName: "\u{1F4F3} Triumph", play: Presets.triumph },
  { name: "Trumpet", displayName: "\u{1F4F3} Trumpet", play: Presets.trumpet },
  { name: "Typewriter", displayName: "\u{1F4F3} Typewriter", play: Presets.typewriter },
  { name: "Unfurl", displayName: "\u{1F4F3} Unfurl", play: Presets.unfurl },
  { name: "Vortex", displayName: "\u{1F4F3} Vortex", play: Presets.vortex },
  { name: "Wane", displayName: "\u{1F4F3} Wane", play: Presets.wane },
  { name: "WarDrum", displayName: "\u{1F4F3} WarDrum", play: Presets.warDrum },
  { name: "Waterfall", displayName: "\u{1F4F3} Waterfall", play: Presets.waterfall },
  { name: "Wave", displayName: "\u{1F4F3} Wave", play: Presets.wave },
  { name: "Wisp", displayName: "\u{1F4F3} Wisp", play: Presets.wisp },
  { name: "Wobble", displayName: "\u{1F4F3} Wobble", play: Presets.wobble },
  { name: "Woodpecker", displayName: "\u{1F4F3} Woodpecker", play: Presets.woodpecker },
  { name: "Zipper", displayName: "\u{1F4F3} Zipper", play: Presets.zipper },
];

const HAPTIC_SUPPORT_LABELS: Record<number, string> = {
  [HapticSupport.NO_SUPPORT]: "No Support",
  [HapticSupport.MINIMAL_SUPPORT]: "Minimal Support",
  [HapticSupport.LIMITED_SUPPORT]: "Limited Support",
  [HapticSupport.STANDARD_SUPPORT]: "Standard Support",
  [HapticSupport.ADVANCED_SUPPORT]: "Advanced Support",
};

// ─── App ────────────────────────────────────────────────────────────────────

export function App() {
  const [activeTab, setActiveTab] = useState<string>("presets");

  // ─── APIs tab state ─────────────────────────────────────────────────────
  const [hapticsEnabled, setHapticsEnabled] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(false);
  const [cacheEnabled, setCacheEnabled] = useState(true);
  const [impulseCompositionEnabled, setImpulseCompositionEnabled] = useState(false);
  const [hapticSupport, setHapticSupport] = useState<number>(-1);
  const [forcedSupportLevel, setForcedSupportLevel] = useState<number>(-1);
  const [lastAction, setLastAction] = useState("");

  // Pattern composer
  const testPattern: Pattern = {
    discretePattern: [
      { time: 0, amplitude: 1.0, frequency: 0.5 },
      { time: 200, amplitude: 0.8, frequency: 0.7 },
    ],
    continuousPattern: {
      amplitude: [
        { time: 0, value: 0.5 },
        { time: 300, value: 1.0 },
      ],
      frequency: [
        { time: 0, value: 0.5 },
        { time: 300, value: 0.8 },
      ],
    },
  };
  const patternComposer = usePatternComposer();
  const [patternParsed, setPatternParsed] = useState(false);

  useEffect(() => {
    const support = Settings.getHapticsSupportLevel();
    setHapticSupport(support);
  }, []);

  // ─── Tab handlers ───────────────────────────────────────────────────────
  const handleTabPresets = () => setActiveTab("presets");
  const handleTabRealtime = () => setActiveTab("realtime");
  const handleTabApis = () => setActiveTab("apis");

  // ─── API handlers ──────────────────────────────────────────────────────
  const handlePlayByName = () => {
    Presets.System.notificationSuccess();
    setLastAction("Played 'Success' preset by name");
  };

  const handleToggleHaptics = () => {
    const newState = !hapticsEnabled;
    Settings.enableHaptics(newState);
    setHapticsEnabled(newState);
    setLastAction(`Haptics ${newState ? "enabled" : "disabled"}`);
  };

  const handleToggleSound = () => {
    const newState = !soundEnabled;
    Settings.enableSound(newState);
    setSoundEnabled(newState);
    setLastAction(`Sound ${newState ? "enabled" : "disabled"}`);
  };

  const handleToggleCache = () => {
    const newState = !cacheEnabled;
    Settings.enableCache(newState);
    setCacheEnabled(newState);
    setLastAction(`Cache ${newState ? "enabled" : "disabled"}`);
  };

  const handleClearCache = () => {
    Settings.clearCache();
    setLastAction("Cache cleared");
  };

  const handlePreloadPresets = () => {
    Settings.preloadPresets(["Fanfare", "Explosion", "Heartbeat"]);
    setLastAction("Preloaded: Fanfare, Explosion, Heartbeat");
  };

  const handleStopHaptics = () => {
    Settings.stopHaptics();
    setLastAction("All haptics stopped");
  };

  const handleShutDownEngine = () => {
    Settings.shutDownEngine();
    setLastAction("Engine shut down");
  };

  const handleToggleImpulseComposition = () => {
    const newState = !impulseCompositionEnabled;
    Settings.enableImpulseCompositionMode(newState);
    setImpulseCompositionEnabled(newState);
    setLastAction(`Impulse composition mode ${newState ? "enabled" : "disabled"}`);
  };

  const handleGetHapticSupport = () => {
    const support = Settings.getHapticsSupportLevel();
    setHapticSupport(support);
    setLastAction(`Haptic support: ${HAPTIC_SUPPORT_LABELS[support]}`);
  };

  const handleForceSupport0 = () => { Settings.forceHapticsSupportLevel(HapticSupport.NO_SUPPORT); setForcedSupportLevel(0); setLastAction(`Forced support to: ${HAPTIC_SUPPORT_LABELS[0]}`); };
  const handleForceSupport1 = () => { Settings.forceHapticsSupportLevel(HapticSupport.MINIMAL_SUPPORT); setForcedSupportLevel(1); setLastAction(`Forced support to: ${HAPTIC_SUPPORT_LABELS[1]}`); };
  const handleForceSupport2 = () => { Settings.forceHapticsSupportLevel(HapticSupport.LIMITED_SUPPORT); setForcedSupportLevel(2); setLastAction(`Forced support to: ${HAPTIC_SUPPORT_LABELS[2]}`); };
  const handleForceSupport3 = () => { Settings.forceHapticsSupportLevel(HapticSupport.STANDARD_SUPPORT); setForcedSupportLevel(3); setLastAction(`Forced support to: ${HAPTIC_SUPPORT_LABELS[3]}`); };
  const handleForceSupport4 = () => { Settings.forceHapticsSupportLevel(HapticSupport.ADVANCED_SUPPORT); setForcedSupportLevel(4); setLastAction(`Forced support to: ${HAPTIC_SUPPORT_LABELS[4]}`); };

  const handleParsePattern = () => {
    patternComposer.parse(testPattern);
    setPatternParsed(true);
    setLastAction("Pattern parsed");
  };

  const handlePlayPattern = () => {
    if (!patternParsed) {
      setLastAction("No patterns available. Parse a pattern first.");
      return;
    }
    patternComposer.play();
    setLastAction("Playing pattern");
  };

  const handleReleasePattern = () => {
    if (!patternParsed) {
      setLastAction("No patterns to release.");
      return;
    }
    patternComposer.stop();
    setPatternParsed(false);
    setLastAction("Pattern released");
  };

  return (
    <view className="page">
      {/* ─── Tab Content ──────────────────────────────────────────────── */}
      <view className="tab-content">
        {/* Presets Tab */}
        <view className="tab-panel" style={{ display: activeTab === "presets" ? "flex" : "none", zIndex: activeTab === "presets" ? 10 : 0 }}>
          <scroll-view scroll-orientation="vertical" style={{ flex: 1 }}>
            <view className="scroll-content">
              <text className="title">Haptic Presets</text>
              <text className="subtitle">Test all available haptic presets in the Pulsar library</text>

              <view className="presets-list">
                {PRESETS.map((preset) => (
                  <view
                    key={preset.name}
                    className="preset-row"
                    bindtap={() => { preset.play(); setLastAction(`Played: ${preset.displayName}`); }}
                  >
                    <text className="preset-name">{preset.displayName}</text>
                    <view className="play-button">
                      <text className="play-button-text">{"\u25B6 Play"}</text>
                    </view>
                  </view>
                ))}
              </view>
            </view>
          </scroll-view>
        </view>

        {/* Realtime Composer Tab (placeholder) */}
        <view className="tab-panel" style={{ display: activeTab === "realtime" ? "flex" : "none", zIndex: activeTab === "realtime" ? 10 : 0 }}>
          <view className="placeholder-container">
            <text className="placeholder-icon">{"\u{1F3AE}"}</text>
            <text className="placeholder-title">Realtime Composer</text>
            <text className="placeholder-subtitle">Coming in Phase 2 — Requires gesture events and useRealtimeComposer hook</text>
          </view>
        </view>

        {/* APIs Tab */}
        <view className="tab-panel" style={{ display: activeTab === "apis" ? "flex" : "none", zIndex: activeTab === "apis" ? 10 : 0 }}>
          <scroll-view scroll-orientation="vertical" style={{ flex: 1 }}>
            <view className="scroll-content">
              <text className="title">Public API Testing</text>
              <text className="subtitle">Test all public methods and settings</text>

              {/* Status Display */}
              <view style={{ display: lastAction ? "flex" : "none" }}>
                <view className="status-box">
                  <text className="status-label">Last Action:</text>
                  <text className="status-text">{lastAction}</text>
                </view>
              </view>

              {/* Pulsar Settings */}
              <view className="section">
                <text className="section-title">{"\u2699\uFE0F Pulsar Settings"}</text>

                <view className="api-button" bindtap={handlePlayByName}>
                  <view className="api-button-text">
                    <text className="api-button-title">Play Preset by Name</text>
                    <text className="api-button-subtitle">Pulsar_play('Success')</text>
                  </view>
                </view>

                <view className="api-button" bindtap={handleToggleHaptics}>
                  <view className="api-button-text">
                    <text className="api-button-title">{hapticsEnabled ? "Disable" : "Enable"} Haptics</text>
                    <text className="api-button-subtitle">Pulsar_enableHaptics()</text>
                  </view>
                  <view className="status-badge">
                    <text className="status-badge-text">{hapticsEnabled ? "\u2705 Enabled" : "\u274C Disabled"}</text>
                  </view>
                </view>

                <view className="api-button" bindtap={handleToggleSound}>
                  <view className="api-button-text">
                    <text className="api-button-title">{soundEnabled ? "Disable" : "Enable"} Sound</text>
                    <text className="api-button-subtitle">Pulsar_enableSound()</text>
                  </view>
                  <view className="status-badge">
                    <text className="status-badge-text">{soundEnabled ? "\u2705 Enabled" : "\u274C Disabled"}</text>
                  </view>
                </view>

                <view className="api-button" bindtap={handleToggleCache}>
                  <view className="api-button-text">
                    <text className="api-button-title">{cacheEnabled ? "Disable" : "Enable"} Cache</text>
                    <text className="api-button-subtitle">Pulsar_enableCache()</text>
                  </view>
                  <view className="status-badge">
                    <text className="status-badge-text">{cacheEnabled ? "\u2705 Enabled" : "\u274C Disabled"}</text>
                  </view>
                </view>

                <view className="api-button" bindtap={handleClearCache}>
                  <view className="api-button-text">
                    <text className="api-button-title">Clear Cache</text>
                    <text className="api-button-subtitle">Pulsar_clearCache()</text>
                  </view>
                </view>

                <view className="api-button" bindtap={handlePreloadPresets}>
                  <view className="api-button-text">
                    <text className="api-button-title">Preload Presets</text>
                    <text className="api-button-subtitle">Pulsar_preloadPresets(['Fanfare', 'Explosion', 'Heartbeat'])</text>
                  </view>
                </view>

                <view className="api-button" bindtap={handleStopHaptics}>
                  <view className="api-button-text">
                    <text className="api-button-title">Stop All Haptics</text>
                    <text className="api-button-subtitle">Pulsar_stopHaptics()</text>
                  </view>
                </view>

                <view className="api-button" bindtap={handleShutDownEngine}>
                  <view className="api-button-text">
                    <text className="api-button-title">Shut Down Engine</text>
                    <text className="api-button-subtitle">Pulsar_shutDownEngine()</text>
                  </view>
                </view>

                <view className="api-button" bindtap={handleToggleImpulseComposition}>
                  <view className="api-button-text">
                    <text className="api-button-title">{impulseCompositionEnabled ? "Disable" : "Enable"} Impulse Composition Mode</text>
                    <text className="api-button-subtitle">Settings.enableImpulseCompositionMode()</text>
                  </view>
                  <view className="status-badge">
                    <text className="status-badge-text">{impulseCompositionEnabled ? "\u2705 Enabled" : "\u274C Disabled"}</text>
                  </view>
                </view>
              </view>

              {/* Haptic Support */}
              <view className="section">
                <text className="section-title">{"\u{1F4F1} Haptic Support"}</text>

                <view className="api-button" bindtap={handleGetHapticSupport}>
                  <view className="api-button-text">
                    <text className="api-button-title">Get Haptic Support</text>
                    <text className="api-button-subtitle">Pulsar_hapticSupport()</text>
                  </view>
                  <view className="status-badge">
                    <text className="status-badge-text">{hapticSupport >= 0 ? HAPTIC_SUPPORT_LABELS[hapticSupport] : "Unknown"}</text>
                  </view>
                </view>

                <view className="sub-section">
                  <text className="sub-section-title">Force Support Level:</text>

                  <view className="api-button api-button-compact" bindtap={handleForceSupport0}>
                    <view className="api-button-text">
                      <text className="api-button-title">No Support</text>
                      <text className="api-button-subtitle">Force to No Support</text>
                    </view>
                    <view style={{ display: forcedSupportLevel === 0 ? "flex" : "none" }}>
                      <view className="status-badge">
                        <text className="status-badge-text">{"\u2713 Active"}</text>
                      </view>
                    </view>
                  </view>

                  <view className="api-button api-button-compact" bindtap={handleForceSupport1}>
                    <view className="api-button-text">
                      <text className="api-button-title">Minimal Support</text>
                      <text className="api-button-subtitle">Force to Minimal Support</text>
                    </view>
                    <view style={{ display: forcedSupportLevel === 1 ? "flex" : "none" }}>
                      <view className="status-badge">
                        <text className="status-badge-text">{"\u2713 Active"}</text>
                      </view>
                    </view>
                  </view>

                  <view className="api-button api-button-compact" bindtap={handleForceSupport2}>
                    <view className="api-button-text">
                      <text className="api-button-title">Limited Support</text>
                      <text className="api-button-subtitle">Force to Limited Support</text>
                    </view>
                    <view style={{ display: forcedSupportLevel === 2 ? "flex" : "none" }}>
                      <view className="status-badge">
                        <text className="status-badge-text">{"\u2713 Active"}</text>
                      </view>
                    </view>
                  </view>

                  <view className="api-button api-button-compact" bindtap={handleForceSupport3}>
                    <view className="api-button-text">
                      <text className="api-button-title">Standard Support</text>
                      <text className="api-button-subtitle">Force to Standard Support</text>
                    </view>
                    <view style={{ display: forcedSupportLevel === 3 ? "flex" : "none" }}>
                      <view className="status-badge">
                        <text className="status-badge-text">{"\u2713 Active"}</text>
                      </view>
                    </view>
                  </view>

                  <view className="api-button api-button-compact" bindtap={handleForceSupport4}>
                    <view className="api-button-text">
                      <text className="api-button-title">Advanced Support</text>
                      <text className="api-button-subtitle">Force to Advanced Support</text>
                    </view>
                    <view style={{ display: forcedSupportLevel === 4 ? "flex" : "none" }}>
                      <view className="status-badge">
                        <text className="status-badge-text">{"\u2713 Active"}</text>
                      </view>
                    </view>
                  </view>
                </view>
              </view>

              {/* Pattern Composer */}
              <view className="section">
                <text className="section-title">{"\u{1F3B5} Pattern Composer"}</text>

                <view className="api-button" bindtap={handleParsePattern}>
                  <view className="api-button-text">
                    <text className="api-button-title">Parse Pattern</text>
                    <text className="api-button-subtitle">PatternComposer_parsePattern()</text>
                  </view>
                  <view className="status-badge">
                    <text className="status-badge-text">{patternParsed ? "1 pattern(s) parsed" : "0 pattern(s) parsed"}</text>
                  </view>
                </view>

                <view className="api-button" style={{ opacity: patternParsed ? 1 : 0.5 }} bindtap={handlePlayPattern}>
                  <view className="api-button-text">
                    <text className="api-button-title">Play Pattern</text>
                    <text className="api-button-subtitle">PatternComposer_play()</text>
                  </view>
                </view>

                <view className="api-button" style={{ opacity: patternParsed ? 1 : 0.5 }} bindtap={handleReleasePattern}>
                  <view className="api-button-text">
                    <text className="api-button-title">Release Pattern</text>
                    <text className="api-button-subtitle">PatternComposer_release()</text>
                  </view>
                </view>
              </view>

              {/* Bottom spacer */}
              <view style={{ height: "40px" }} />
            </view>
          </scroll-view>
        </view>
      </view>

      {/* ─── Bottom Tab Bar ───────────────────────────────────────────── */}
      <view className="tab-bar">
        <view className={`tab ${activeTab === "presets" ? "tab-active" : ""}`} bindtap={handleTabPresets}>
          <text className="tab-icon">{"\u{1F3B5}"}</text>
          <text className={`tab-text ${activeTab === "presets" ? "tab-text-active" : ""}`}>Presets</text>
        </view>
        <view className={`tab ${activeTab === "realtime" ? "tab-active" : ""}`} bindtap={handleTabRealtime}>
          <text className="tab-icon">{"\u{1F3AE}"}</text>
          <text className={`tab-text ${activeTab === "realtime" ? "tab-text-active" : ""}`}>Realtime</text>
        </view>
        <view className={`tab ${activeTab === "apis" ? "tab-active" : ""}`} bindtap={handleTabApis}>
          <text className="tab-icon">{"\u2699\uFE0F"}</text>
          <text className={`tab-text ${activeTab === "apis" ? "tab-text-active" : ""}`}>APIs</text>
        </view>
      </view>
    </view>
  );
}
