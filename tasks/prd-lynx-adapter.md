# PRD: Lynx Platform Adapter for Pulsar

## Introduction

Pulsar is a cross-platform haptics library currently supporting iOS, Android, and React Native. This PRD covers adding Lynx platform support, enabling Lynx applications to use Pulsar's haptic presets, pattern composer, and settings APIs via Lynx Native Modules.

Lynx is a cross-platform UI framework with its own native module system (`NativeModules` global, `LynxModule` protocol on iOS, `@LynxMethod` on Android). The adapter bridges Pulsar's existing native SDKs (Swift/Kotlin) to Lynx's JS runtime.

### Why not RealtimeComposer?

Pulsar has 4 core APIs: **Presets**, **PatternComposer**, **RealtimeComposer**, and **Settings**. RealtimeComposer requires per-frame haptic updates synchronized with gestures, which depends on Lynx's Main Thread Scripting (MTS) supporting Native Module calls — a capability not yet available. RealtimeComposer is explicitly deferred to a future phase. The other 3 APIs (covering ~95% of use cases) work perfectly on Lynx's background thread without any experience degradation.

## Goals

- Enable Lynx applications to trigger Pulsar's 200+ haptic presets on iOS and Android
- Provide PatternComposer for custom haptic pattern authoring in Lynx
- Expose Settings API for haptic engine configuration (enable/disable, cache, support level)
- Reuse the existing iOS Swift SDK and Android Kotlin SDK without modification
- Match the developer ergonomics of the React Native API as closely as possible
- Deliver a self-contained `lynx-pulsar` package with source-mirrored native SDKs (consistent with the RN package's approach)

## User Stories

### US-001: Lynx NativeModule bridge — TypeScript interface
**Description:** As a Lynx app developer, I need a TypeScript interface that declares the PulsarModule on `NativeModules` so I can call haptic methods from JS.

**Acceptance Criteria:**
- [ ] Create `lynx/lynx-pulsar/src/NativePulsar.ts` with `declare let NativeModules` typing for `PulsarModule`
- [ ] Interface exposes: `play(name)`, `enableHaptics(state)`, `enableSound(state)`, `enableCache(state)`, `clearCache()`, `preloadPresets(names)`, `stopHaptics()`, `shutDownEngine()`, `hapticSupport()`, `forceHapticsSupportLevel(level)`, `enableImpulseCompositionMode(state)`, `setRealtimeComposerStrategy(strategy)`
- [ ] Interface exposes PatternComposer methods: `parsePattern(data): number`, `patternPlay(id)`, `patternStop(id)`, `patternRelease(id)`
- [ ] Export `HapticSupport` and `RealtimeComposerStrategy` enums
- [ ] No dependency on `react-native` — only Lynx globals
- [ ] TypeScript compiles without errors

### US-002: Presets API
**Description:** As a Lynx app developer, I want to call `Presets.dogBark()` to trigger a haptic preset, matching the React Native API.

**Acceptance Criteria:**
- [ ] Create `lynx/lynx-pulsar/src/Presets.ts` exporting all 200+ presets as functions
- [ ] Each preset calls `NativeModules.PulsarModule.play(presetName)`
- [ ] No `'worklet'` directives (Lynx has no Reanimated)
- [ ] System presets included: `System.impactLight`, `System.notificationSuccess`, `System.selection`, etc.
- [ ] Android-specific system presets under `System.Android.*`
- [ ] TypeScript compiles without errors

### US-003: Settings API
**Description:** As a Lynx app developer, I want to configure the haptic engine (enable/disable haptics, manage cache, query support level).

**Acceptance Criteria:**
- [ ] Create `lynx/lynx-pulsar/src/Settings.ts` wrapping all settings methods
- [ ] API shape matches RN version: `Settings.enableHaptics(bool)`, `Settings.getHapticsSupportLevel()`, etc.
- [ ] TypeScript compiles without errors

### US-004: PatternComposer hook
**Description:** As a Lynx app developer, I want to compose custom haptic patterns using `usePatternComposer` with the same `Pattern` type as React Native.

**Acceptance Criteria:**
- [ ] Create `lynx/lynx-pulsar/src/usePatternComposer.ts` using `@lynx-js/react` hooks
- [ ] `parse(pattern)` calls `PulsarModule.parsePattern(data)` and stores returned `patternId`
- [ ] `play()` and `stop()` operate on the stored `patternId`
- [ ] Cleanup releases pattern on unmount via `useEffect` return
- [ ] No `'worklet'` directives
- [ ] TypeScript compiles without errors

### US-005: Types and package entry point
**Description:** As a Lynx app developer, I want to `import { Presets, Settings, usePatternComposer } from 'lynx-pulsar'`.

**Acceptance Criteria:**
- [ ] Create `lynx/lynx-pulsar/src/types.ts` with `Pattern`, `PatternComposer`, `AdaptivePreset` (extended with optional `lynx` field), `AdaptiveHaptics`
- [ ] Create `lynx/lynx-pulsar/src/index.tsx` re-exporting Presets, Settings, usePatternComposer, types, and enums
- [ ] `useRealtimeComposer` and `useAdaptiveHaptics` are NOT exported in this phase
- [ ] Create `package.json` with appropriate metadata, `@lynx-js/react` as peer dependency

### US-006: iOS LynxModule bridge
**Description:** As a Lynx app developer on iOS, I need the native module registered so JS calls reach the Swift Pulsar SDK.

**Acceptance Criteria:**
- [ ] Create `lynx/lynx-pulsar/ios/PulsarLynxModule.m` (or `.mm`) implementing `LynxModule` protocol
- [ ] `+name` returns `@"PulsarModule"`
- [ ] `+methodLookup` maps all JS method names to ObjC selectors
- [ ] Each method delegates to the existing Swift `Pulsar` class (same as `Haptics.mm` does for RN)
- [ ] Mirror iOS Swift SDK sources into `lynx/lynx-pulsar/deps/Pulsar/` (same mirroring strategy as RN package)
- [ ] Provide registration example: `[globalConfig registerModule:PulsarLynxModule.class]`
- [ ] Builds without errors against Lynx SDK headers

### US-007: Android LynxModule bridge
**Description:** As a Lynx app developer on Android, I need the native module registered so JS calls reach the Kotlin Pulsar SDK.

**Acceptance Criteria:**
- [ ] Create `lynx/lynx-pulsar/android/src/.../PulsarLynxModule.kt` extending `LynxModule`
- [ ] Constructor takes `Context` parameter
- [ ] All exposed methods annotated with `@LynxMethod`
- [ ] Each method delegates to the existing Kotlin `Pulsar` class (same logic as `PulsarModule.kt` for RN)
- [ ] `PatternComposer` registry (`MutableMap<Int, PatternComposer>`) for pattern lifecycle management
- [ ] Provide registration example: `LynxEnv.inst().registerModule("PulsarModule", PulsarLynxModule::class.java)`
- [ ] Builds without errors against Lynx SDK

### US-008: Verify synchronous return values work in Lynx
**Description:** As a developer, I need to confirm that Lynx Native Module methods can return values synchronously (number, boolean) since `parsePattern()`, `hapticSupport()` rely on this.

**Acceptance Criteria:**
- [ ] Write a minimal test module with a method returning `Int`/`Double` on Android
- [ ] Write a minimal test module with a method returning `NSNumber` on iOS
- [ ] Verify JS receives the return value in both cases
- [ ] If synchronous returns are NOT supported, document callback-based fallback design for `parsePattern`, `hapticSupport`

## Functional Requirements

- FR-1: `NativeModules.PulsarModule.play(name: string)` triggers the named preset on iOS (CoreHaptics) and Android (VibrationEffect)
- FR-2: `NativeModules.PulsarModule.parsePattern(data: object)` returns an integer `patternId` synchronously
- FR-3: `NativeModules.PulsarModule.patternPlay(patternId: number)` plays a previously parsed pattern
- FR-4: `NativeModules.PulsarModule.hapticSupport()` returns the device's haptic capability level (0-4)
- FR-5: All Settings methods (`enableHaptics`, `enableSound`, `enableCache`, `clearCache`, `preloadPresets`, `stopHaptics`, `shutDownEngine`, `forceHapticsSupportLevel`, `enableImpulseCompositionMode`, `setRealtimeComposerStrategy`) are accessible
- FR-6: iOS bridge wraps existing Swift Pulsar SDK without modifications to the SDK
- FR-7: Android bridge wraps existing Kotlin Pulsar SDK without modifications to the SDK
- FR-8: Pattern data (`discretePattern` + `continuousPattern` nested objects/arrays) serializes correctly across the Lynx bridge (JS object → `NSDictionary`/`ReadableMap`)

## Non-Goals

- **RealtimeComposer**: Deferred until Lynx MTS supports Native Module calls. No `useRealtimeComposer` export.
- **useAdaptiveHaptics**: Deferred. Depends on platform detection API and RealtimeComposer.
- **Sound playback**: Out of scope for initial release (low priority feature in Pulsar).
- **HarmonyOS support**: Not in scope despite Lynx supporting it — Pulsar has no HarmonyOS SDK.
- **Modifications to existing iOS/Android SDKs**: The native SDKs are used as-is via source mirroring.
- **Auto-linking or build plugin**: Users manually register the module; no automatic integration tooling.

## Technical Considerations

### Source mirroring strategy
Follow the same approach as the React Native package:
- iOS Swift SDK mirrored into `deps/Pulsar/`
- Android Kotlin SDK sources included in the android source set
- When upstream SDK changes, mirror must be manually synced (documented in CONTRIBUTING)

### Thread model
- Lynx Native Modules execute on the background thread (equivalent to RN's JS thread)
- All Pulsar API calls (except RealtimeComposer) are fire-and-forget or quick synchronous queries — background thread execution is fine
- No threading concerns for Presets, PatternComposer, or Settings

### Key risk: synchronous return values
- US-008 must be completed first — if Lynx doesn't support sync returns, `parsePattern` needs a callback-based redesign
- Fallback: `parsePattern(data, callback)` where callback receives `patternId`

### Dependencies
- `@lynx-js/react` (peer dependency) for hooks (`useCallback`, `useEffect`)
- Lynx SDK headers: `LynxModule.h` (iOS), `com.lynx.jsbridge.LynxModule` (Android)
- No dependency on `react-native` or Reanimated

## Success Metrics

- All 200+ presets playable from a Lynx app on both iOS and Android
- PatternComposer can parse and play custom patterns
- Settings API fully functional
- No modifications required to the upstream iOS/Android Pulsar SDKs
- API shape is familiar to developers who have used the React Native version

## Open Questions

1. ~~Can Lynx Native Module methods return values synchronously?~~ → Addressed by US-008
2. What is the Lynx equivalent of `Platform.OS` for platform detection? (Needed for future `useAdaptiveHaptics`)
3. Should the package name be `lynx-pulsar` or `@anthropic/lynx-pulsar` or follow Pulsar's existing naming?
4. When Lynx MTS adds Native Module support, will the API surface for MTS modules differ from background thread modules?
