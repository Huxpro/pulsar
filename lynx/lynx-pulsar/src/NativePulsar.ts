export enum HapticSupport {
  NO_SUPPORT = 0,
  MINIMAL_SUPPORT = 1,
  LIMITED_SUPPORT = 2,
  STANDARD_SUPPORT = 3,
  ADVANCED_SUPPORT = 4,
}

export enum RealtimeComposerStrategy {
  ENVELOPE = 0,
  PRIMITIVE_TICK = 1,
  PRIMITIVE_COMPLEX = 2,
  ENVELOPE_WITH_DISCRETE_PRIMITIVES = 3,
}

interface PulsarModule {
  // Pulsar
  play(name: string): void;
  enableHaptics(state: boolean): void;
  enableSound(state: boolean): void;
  enableCache(state: boolean): void;
  clearCache(): void;
  preloadPresets(names: string[]): void;
  stopHaptics(): void;
  shutDownEngine(): void;
  hapticSupport(): number;
  forceHapticsSupportLevel(level: number): void;
  enableImpulseCompositionMode(state: boolean): void;
  setRealtimeComposerStrategy(strategy: number): void;

  // PatternComposer
  parsePattern(data: object): number;
  patternPlay(id: number): void;
  patternStop(id: number): void;
  patternRelease(id: number): void;
}

declare const NativeModules: {
  PulsarModule: PulsarModule;
} | undefined;

// Guard: NativeModules is only available on the background thread in ReactLynx's
// dual-thread architecture. On the main thread (snapshot evaluation), it's undefined.
// Methods are only ever called from event handlers/effects (background thread).
const Pulsar: PulsarModule =
  (typeof NativeModules !== 'undefined' && NativeModules?.PulsarModule) ||
  ({} as PulsarModule);

export default Pulsar;
