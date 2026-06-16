# PRD: Android Support for lynx-pulsar

## Introduction

The `lynx-pulsar` Lynx Native Module adapter has a Kotlin bridge (`PulsarLynxModule.kt`) and `build.gradle` that were written but never verified. This PRD covers the work to bring Android to full parity with iOS: fix build gaps, add missing RealtimeComposer bridge, integrate with LynxExplorer, and validate end-to-end via `lynx-devtool`.

## Goals

- Android haptics work in LynxExplorer with full API parity (presets, pattern composer, realtime composer, all Settings)
- `lynx-pulsar` Android module builds cleanly as a Gradle library
- All 6 demo screens in `lynx-pulsar-app` produce haptic feedback on Android devices
- Validation automated via `lynx-devtool` CDP/App commands

## User Stories

### US-001: Fix Android Module Build Infrastructure

**Description:** As a developer, I want the `lynx-pulsar` Android module to compile as a valid Android library so it can be consumed by LynxExplorer.

**Acceptance Criteria:**
- [ ] `AndroidManifest.xml` exists at `android/src/main/AndroidManifest.xml` with `<uses-permission android:name="android.permission.VIBRATE" />`
- [ ] `proguard-rules.pro` with consumer rules to keep `PulsarLynxModule` and `@LynxMethod`-annotated methods
- [ ] `build.gradle` references proguard consumer rules
- [ ] `./gradlew :lynx-pulsar:assembleRelease` (or equivalent) compiles without errors
- [ ] Kotlin SDK sources from `../../Android/Pulsar/src/main/java` resolve correctly

---

### US-002: Add RealtimeComposer Bridge (Full Parity)

**Description:** As a developer, I want the RealtimeComposer API bridged to Android so the Lynx adapter has full feature parity with the React Native adapter.

**Source reference:** `react-native/react-native-pulsar/android/.../PulsarModule.kt` — `RealtimeComposer_*` methods

**Acceptance Criteria:**
- [ ] `PulsarLynxModule.kt` exposes 4 new `@LynxMethod` methods:
  - `realtimeSet(amplitude: Double, frequency: Double)`
  - `realtimePlayDiscrete(amplitude: Double, frequency: Double)`
  - `realtimeStop()`
  - `realtimeIsActive(): Boolean`
- [ ] `NativePulsar.ts` `PulsarModule` interface includes matching TS methods:
  - `realtimeSet(amplitude: number, frequency: number): void`
  - `realtimePlayDiscrete(amplitude: number, frequency: number): void`
  - `realtimeStop(): void`
  - `realtimeIsActive(): boolean`
- [ ] `Settings.ts` or a new `RealtimeComposer.ts` exports these methods for app consumption
- [ ] `npm run build` passes in `lynx-pulsar-app`

---

### US-003: Register Module in LynxExplorer Android

**Description:** As a developer, I want `PulsarModule` registered in LynxExplorer's Android build so I can test haptics on a real device.

**Acceptance Criteria:**
- [ ] Document the registration call: `LynxEnv.inst().registerModule("PulsarModule", PulsarLynxModule::class.java)`
- [ ] Identify the correct LynxExplorer source file to add the registration (Application class or LynxView initialization)
- [ ] LynxExplorer Android builds with `PulsarModule` registered
- [ ] LynxExplorer can load `lynx-pulsar-app` dev server bundle and `NativeModules.PulsarModule` is defined (not null/undefined)
- [ ] Verify via `lynx-devtool`: connect to LynxExplorer session, confirm module availability

---

### US-004: Verify Presets & Pattern Composer End-to-End _(BLOCKED: needs Android device)_

**Description:** As a developer, I want to confirm that preset playback and pattern composer work on a physical Android device running LynxExplorer.

**Acceptance Criteria:**
- [ ] `Presets.System.impactLight()` triggers vibration on an Android device
- [ ] `Presets.breakingWave()` (named preset) triggers vibration
- [ ] `usePatternComposer` parse/play/stop lifecycle works (buttons demo patterns play correctly)
- [ ] `Settings.getHapticsSupportLevel()` returns a value > 0 on a supported device
- [ ] Verify via `lynx-devtool`: send App command or evaluate JS to trigger `Presets.System.impactLight()` and confirm no error

---

### US-005: Verify RealtimeComposer End-to-End _(BLOCKED: needs Android device)_

**Description:** As a developer, I want to confirm that the RealtimeComposer API works on Android so the full API surface is validated.

**Acceptance Criteria:**
- [ ] `realtimeSet(0.8, 0.5)` produces continuous vibration on device
- [ ] `realtimePlayDiscrete(1.0, 1.0)` produces a single impulse
- [ ] `realtimeStop()` stops active vibration
- [ ] `realtimeIsActive()` returns correct boolean state
- [ ] Verify via `lynx-devtool`: evaluate JS calls through CDP and confirm no errors

---

### US-006: Verify All Settings APIs on Android _(BLOCKED: needs Android device)_

**Description:** As a developer, I want all Settings methods to work correctly on Android, including the Android-specific ones that are no-ops on iOS.

**Acceptance Criteria:**
- [ ] `enableHaptics(false)` disables haptics, `enableHaptics(true)` re-enables
- [ ] `enableSound(true/false)` toggles audio simulation
- [ ] `enableCache(true/false)` toggles preset caching, `clearCache()` clears it
- [ ] `preloadPresets(["BreakingWave", "Chirp"])` preloads without error
- [ ] `stopHaptics()` stops any active playback
- [ ] `forceHapticsSupportLevel(3)` forces STANDARD_SUPPORT mode (functional on Android, no-op on iOS)
- [ ] `enableImpulseCompositionMode(true)` (functional on Android)
- [ ] `setRealtimeComposerStrategy(1)` switches to PRIMITIVE_TICK strategy (functional on Android)
- [ ] Verify via `lynx-devtool`

---

### US-007: Run All 6 Demo Screens on Android _(BLOCKED: needs Android device)_

**Description:** As a user, I want all demo screens in `lynx-pulsar-app` to produce correct haptic feedback when running on an Android device via LynxExplorer.

**Acceptance Criteria:**
- [ ] Buttons demo: all 6 buttons trigger distinct haptic patterns
- [ ] Countdown demo: gentle tick (7-4), intense tick (3-1), celebration double-tap (0)
- [ ] Notification demo: 5 different haptic patterns (stamp, peal, chime, buzz, swell)
- [ ] Dot Loader demo: haptic taps sync to dot bounce animation
- [ ] Slider demo: haptic tick at each 10% boundary for all 3 sliders
- [ ] Balloon demo: escalating haptics during inflate, heavy impact on pop
- [ ] Verify via `lynx-devtool`: connect, open each demo URL, confirm no JS errors

## Functional Requirements

- FR-1: `lynx-pulsar/android` builds as a standalone Android library module
- FR-2: `PulsarLynxModule` exposes all 18 methods (14 existing + 4 RealtimeComposer)
- FR-3: `NativePulsar.ts` interface matches native method signatures 1:1
- FR-4: Module registered in LynxExplorer via `LynxEnv.inst().registerModule()`
- FR-5: `VIBRATE` permission declared in library manifest (merged into host app)
- FR-6: Proguard consumer rules prevent stripping of bridge classes
- FR-7: All validation stories use `lynx-devtool` for automated verification

## Non-Goals

- No changes to the iOS native module
- No changes to the TypeScript Presets/Settings API surface (only adding RealtimeComposer)
- No custom Android app — LynxExplorer is the test host
- No CI/CD pipeline for Android builds (manual for now)
- No automated device farm testing

## Technical Considerations

- **LynxModule constructor**: `PulsarLynxModule(context: Context)` takes a `Context` — verify that Lynx's module registration passes the correct context (Application context or Activity context). The Kotlin SDK's `Pulsar(context)` needs it for `Vibrator` system service access.
- **Shared sources**: `build.gradle` includes Kotlin SDK via `sourceSets` pointing to `../../Android/Pulsar/src/main/java`. This avoids publishing the SDK as a separate AAR but creates a path coupling. Verify this resolves in both standalone and LynxExplorer-integrated builds.
- **API level gating**: Android haptic support varies by API level (26+ basic, 33+ primitives, 36+ envelope). The SDK handles this internally via `CompatibilityMode`, but device testing should cover at least API 26+ and API 33+.
- **lynx-devtool validation**: Use CDP `Runtime.evaluate` to call `NativeModules.PulsarModule.play("BreakingWave")` and check for exceptions. Use App commands to navigate between demo screens.

## Success Metrics

- All 18 native module methods callable from JS without errors
- Haptic feedback perceptible on a physical Android device (API 26+)
- All 6 demo screens functional on Android
- Zero regressions on iOS

## Open Questions

- What Android API level does the LynxExplorer target? (minSdk in the module is 21, but Vibrator API needs 26+)
- Does LynxExplorer's module registration support constructor injection of `Context`, or does `LynxModule` provide it via a base class method?
- Should we publish `lynx-pulsar` Android as a separate AAR, or keep the source-inclusion approach?
