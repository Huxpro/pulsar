import Pulsar, { HapticSupport, RealtimeComposerStrategy } from './NativePulsar';

const Settings = {
  enableHaptics: (state: boolean) => {
    Pulsar.enableHaptics(state);
  },
  enableSound: (state: boolean) => {
    Pulsar.enableSound(state);
  },
  enableCache: (state: boolean) => {
    Pulsar.enableCache(state);
  },
  clearCache: () => {
    Pulsar.clearCache();
  },
  preloadPresets: (presetNames: string[]) => {
    Pulsar.preloadPresets(presetNames);
  },
  stopHaptics: () => {
    Pulsar.stopHaptics();
  },
  shutDownEngine: () => {
    Pulsar.shutDownEngine();
  },
  getHapticsSupportLevel: (): HapticSupport => {
    return Pulsar.hapticSupport();
  },
  forceHapticsSupportLevel: (level: HapticSupport) => {
    Pulsar.forceHapticsSupportLevel(level);
  },
  enableImpulseCompositionMode: (state: boolean) => {
    Pulsar.enableImpulseCompositionMode(state);
  },
  setRealtimeComposerStrategy: (strategy: RealtimeComposerStrategy) => {
    Pulsar.setRealtimeComposerStrategy(strategy);
  },
} as const;

export default Settings;
