import { useState, useEffect } from "@lynx-js/react";
import { Settings, HapticSupport } from "lynx-pulsar";
import type { Pattern } from "lynx-pulsar";
import "./App.css";

declare const NativeModules: {
  PulsarModule: {
    play(name: string): void;
    parsePattern(data: object): number;
    patternPlay(id: number): void;
    patternStop(id: number): void;
    patternRelease(id: number): void;
  };
};

const HAPTIC_SUPPORT_LABELS: Record<number, string> = {
  [HapticSupport.NO_SUPPORT]: "No Support",
  [HapticSupport.MINIMAL_SUPPORT]: "Minimal Support",
  [HapticSupport.LIMITED_SUPPORT]: "Limited Support",
  [HapticSupport.STANDARD_SUPPORT]: "Standard Support",
  [HapticSupport.ADVANCED_SUPPORT]: "Advanced Support",
};

export function PublicApisScreen() {
  const [hapticsEnabled, setHapticsEnabled] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(false);
  const [cacheEnabled, setCacheEnabled] = useState(true);
  const [hapticSupport, setHapticSupport] = useState<number | null>(null);
  const [patternIds, setPatternIds] = useState<number[]>([]);
  const [lastAction, setLastAction] = useState("");
  const [impulseEnabled, setImpulseEnabled] = useState(false);

  useEffect(() => {
    const support = Settings.getHapticsSupportLevel();
    setHapticSupport(support);
  }, []);

  const handlePlayByName = () => {
    NativeModules.PulsarModule.play("Heartbeat");
    setLastAction('Played "Heartbeat" preset by name');
  };

  const handleToggleHaptics = () => {
    const next = !hapticsEnabled;
    Settings.enableHaptics(next);
    setHapticsEnabled(next);
    setLastAction(`Haptics ${next ? "enabled" : "disabled"}`);
  };

  const handleToggleSound = () => {
    const next = !soundEnabled;
    Settings.enableSound(next);
    setSoundEnabled(next);
    setLastAction(`Sound ${next ? "enabled" : "disabled"}`);
  };

  const handleToggleCache = () => {
    const next = !cacheEnabled;
    Settings.enableCache(next);
    setCacheEnabled(next);
    setLastAction(`Cache ${next ? "enabled" : "disabled"}`);
  };

  const handleClearCache = () => {
    Settings.clearCache();
    setLastAction("Cache cleared");
  };

  const handlePreload = () => {
    Settings.preloadPresets(["Fanfare", "Explosion", "Heartbeat"]);
    setLastAction("Preloaded: Fanfare, Explosion, Heartbeat");
  };

  const handleStopHaptics = () => {
    Settings.stopHaptics();
    setLastAction("All haptics stopped");
  };

  const handleShutDown = () => {
    Settings.shutDownEngine();
    setLastAction("Engine shut down");
  };

  const handleToggleImpulse = () => {
    const next = !impulseEnabled;
    Settings.enableImpulseCompositionMode(next);
    setImpulseEnabled(next);
    setLastAction(`Impulse composition ${next ? "enabled" : "disabled"}`);
  };

  const handleGetSupport = () => {
    const support = Settings.getHapticsSupportLevel();
    setHapticSupport(support);
    setLastAction(
      `Haptic support: ${HAPTIC_SUPPORT_LABELS[support] ?? "Unknown"}`
    );
  };

  const handleParsePattern = () => {
    const pattern: Pattern = {
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
    const id = NativeModules.PulsarModule.parsePattern(pattern);
    setPatternIds((prev) => [...prev, id]);
    setLastAction(`Pattern parsed with ID: ${id}`);
  };

  const handlePlayPattern = () => {
    if (patternIds.length === 0) {
      setLastAction("No patterns. Parse one first.");
      return;
    }
    const id = patternIds[patternIds.length - 1]!;
    NativeModules.PulsarModule.patternPlay(id);
    setLastAction(`Playing pattern ID: ${id}`);
  };

  const handleReleasePattern = () => {
    if (patternIds.length === 0) {
      setLastAction("No patterns to release.");
      return;
    }
    const id = patternIds[patternIds.length - 1]!;
    NativeModules.PulsarModule.patternRelease(id);
    setPatternIds((prev) => prev.slice(0, -1));
    setLastAction(`Released pattern ID: ${id}`);
  };

  return (
    <scroll-view scroll-orientation="vertical" style={{ flex: 1 }}>
      <view className="scroll-content">
        <text className="title">Public API Testing</text>
        <text className="subtitle">Test all public methods and settings</text>

        <view
          className="status-box"
          style={{ display: lastAction !== "" ? "flex" : "none" }}
        >
          <text className="status-label">Last Action:</text>
          <text className="status-text">{lastAction}</text>
        </view>

        {/* Pulsar Settings */}
        <view className="section">
          <text className="section-title">Pulsar Settings</text>

          <ApiButton
            title="Play Preset by Name"
            subtitle='play("Heartbeat")'
            onPress={handlePlayByName}
          />
          <ApiButton
            title={`${hapticsEnabled ? "Disable" : "Enable"} Haptics`}
            subtitle="enableHaptics()"
            onPress={handleToggleHaptics}
            status={hapticsEnabled ? "ON" : "OFF"}
          />
          <ApiButton
            title={`${soundEnabled ? "Disable" : "Enable"} Sound`}
            subtitle="enableSound()"
            onPress={handleToggleSound}
            status={soundEnabled ? "ON" : "OFF"}
          />
          <ApiButton
            title={`${cacheEnabled ? "Disable" : "Enable"} Cache`}
            subtitle="enableCache()"
            onPress={handleToggleCache}
            status={cacheEnabled ? "ON" : "OFF"}
          />
          <ApiButton
            title="Clear Cache"
            subtitle="clearCache()"
            onPress={handleClearCache}
          />
          <ApiButton
            title="Preload Presets"
            subtitle="preloadPresets([...])"
            onPress={handlePreload}
          />
          <ApiButton
            title="Stop All Haptics"
            subtitle="stopHaptics()"
            onPress={handleStopHaptics}
          />
          <ApiButton
            title="Shut Down Engine"
            subtitle="shutDownEngine()"
            onPress={handleShutDown}
          />
          <ApiButton
            title={`${impulseEnabled ? "Disable" : "Enable"} Impulse Mode`}
            subtitle="enableImpulseCompositionMode()"
            onPress={handleToggleImpulse}
            status={impulseEnabled ? "ON" : "OFF"}
          />
        </view>

        {/* Haptic Support */}
        <view className="section">
          <text className="section-title">Haptic Support</text>
          <ApiButton
            title="Get Haptic Support Level"
            subtitle="hapticSupport()"
            onPress={handleGetSupport}
            status={
              hapticSupport !== null
                ? (HAPTIC_SUPPORT_LABELS[hapticSupport] ?? "Unknown")
                : "Unknown"
            }
          />
        </view>

        {/* Pattern Composer */}
        <view className="section">
          <text className="section-title">Pattern Composer</text>
          <ApiButton
            title="Parse Pattern"
            subtitle="parsePattern(data)"
            onPress={handleParsePattern}
            status={`${patternIds.length} parsed`}
          />
          <ApiButton
            title="Play Pattern"
            subtitle="patternPlay(id)"
            onPress={handlePlayPattern}
          />
          <ApiButton
            title="Release Pattern"
            subtitle="patternRelease(id)"
            onPress={handleReleasePattern}
          />
        </view>
      </view>
    </scroll-view>
  );
}

function ApiButton({
  title,
  subtitle,
  onPress,
  status,
}: {
  title: string;
  subtitle: string;
  onPress: () => void;
  status?: string;
}) {
  return (
    <view className="api-button" bindtap={onPress}>
      <view className="api-button-content">
        <view className="api-button-text">
          <text className="api-button-title">{title}</text>
          <text className="api-button-subtitle">{subtitle}</text>
        </view>
        <view
          className="status-badge"
          style={{ display: status != null ? "flex" : "none" }}
        >
          <text className="status-badge-text">{status ?? ""}</text>
        </view>
      </view>
    </view>
  );
}
