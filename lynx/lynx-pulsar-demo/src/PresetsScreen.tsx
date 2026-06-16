import { Presets } from "lynx-pulsar";
import "./App.css";

interface PresetItem {
  name: string;
  displayName: string;
  play: () => void;
}

const PRESETS: PresetItem[] = [
  { name: "SystemImpactLight", displayName: "Impact Light", play: Presets.System.impactLight },
  { name: "SystemImpactMedium", displayName: "Impact Medium", play: Presets.System.impactMedium },
  { name: "SystemImpactHeavy", displayName: "Impact Heavy", play: Presets.System.impactHeavy },
  { name: "SystemImpactSoft", displayName: "Impact Soft", play: Presets.System.impactSoft },
  { name: "SystemImpactRigid", displayName: "Impact Rigid", play: Presets.System.impactRigid },
  { name: "SystemNotificationSuccess", displayName: "Notification Success", play: Presets.System.notificationSuccess },
  { name: "SystemNotificationWarning", displayName: "Notification Warning", play: Presets.System.notificationWarning },
  { name: "SystemNotificationError", displayName: "Notification Error", play: Presets.System.notificationError },
  { name: "SystemSelection", displayName: "Selection", play: Presets.System.selection },
  { name: "Heartbeat", displayName: "Heartbeat", play: Presets.heartbeat },
  { name: "DogBark", displayName: "Dog Bark", play: Presets.dogBark },
  { name: "Explosion", displayName: "Explosion", play: Presets.explosion },
  { name: "Fanfare", displayName: "Fanfare", play: Presets.fanfare },
  { name: "Thunder", displayName: "Thunder", play: Presets.thunder },
  { name: "Chime", displayName: "Chime", play: Presets.chime },
  { name: "Buzz", displayName: "Buzz", play: Presets.buzz },
  { name: "Snap", displayName: "Snap", play: Presets.snap },
  { name: "Knock", displayName: "Knock", play: Presets.knock },
  { name: "Ping", displayName: "Ping", play: Presets.ping },
  { name: "Bloom", displayName: "Bloom", play: Presets.bloom },
  { name: "Cascade", displayName: "Cascade", play: Presets.cascade },
  { name: "Ripple", displayName: "Ripple", play: Presets.ripple },
  { name: "Surge", displayName: "Surge", play: Presets.surge },
  { name: "Wobble", displayName: "Wobble", play: Presets.wobble },
  { name: "Stamp", displayName: "Stamp", play: Presets.stamp },
  { name: "Typewriter", displayName: "Typewriter", play: Presets.typewriter },
  { name: "Zipper", displayName: "Zipper", play: Presets.zipper },
];

export function PresetsScreen() {
  return (
    <scroll-view scroll-orientation="vertical" style={{ flex: 1 }}>
      <view className="scroll-content">
        <text className="title">Haptic Presets</text>
        <text className="subtitle">Tap Play to trigger each haptic preset</text>

        {PRESETS.map((preset) => (
          <view key={preset.name} className="preset-row">
            <text className="preset-name">{preset.displayName}</text>
            <view className="play-button" bindtap={() => preset.play()}>
              <text className="play-button-text">Play</text>
            </view>
          </view>
        ))}
      </view>
    </scroll-view>
  );
}
