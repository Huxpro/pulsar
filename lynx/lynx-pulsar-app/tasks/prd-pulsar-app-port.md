# PRD: Port Official PulsarApp to Lynx

## Introduction

Port the official Pulsar demo app (`PulsarApp/` at repo root, Expo Router) to Lynx as `lynx/lynx-pulsar-app/`. This is the polished, production-quality app by Krzysztof Piaskowy (Software Mansion) — the "real" showcase for the Pulsar haptics SDK. The Lynx port should faithfully reproduce the UI, interactions, and haptic behaviors within Lynx's platform constraints.

**Source:** `/Users/bytedance/github/pulsar/PulsarApp/`
**Target:** `/Users/bytedance/github/pulsar/lynx/lynx-pulsar-app/`
**Adapter:** `lynx-pulsar` (local `file:../lynx-pulsar` dependency)
**Constraints:** See `lynx/lynx-pulsar-app/AGENTS.md`

## Verification Protocol

**Every story MUST be verified with these steps before marking done:**

1. **Lynx docs check**: Before using any Lynx element or CSS property, use the `lynx-docs` MCP resources or `lynxbase` skill to verify the correct syntax, supported properties, and known limitations. Common pitfalls:
   - All CSS length values MUST have units (e.g. `16px` not `16`) except `0`
   - Check which CSS properties are actually supported in Lynx
   - Check element-specific attributes (e.g. `<image>` src handling, `<input>` events)
   - Check layout model differences (`display: linear` vs `display: flex`)

2. **DevTool screenshot**: After `npm run build` passes, use the `/lynx-devtool` skill to take a screenshot of the running app on the connected device/simulator. Visually verify the UI matches expectations.

3. **No silent failures**: If something doesn't render (blank area, missing image, broken layout), investigate via DevTool inspection before proceeding.

## Known Issues (from first implementation attempt)

- **Tab bar not at bottom**: `display: linear` + `flex: 1` layout not working as expected. The tab bar renders mid-screen instead of at the bottom.
- **Preset images not rendering**: `<image>` src from bundled imports may need different handling in Lynx.
- **CSS units warning**: "CSS length need units (except 0)" — some CSS values are missing `px` units.
- **Content area not filling**: The `tab-content` area doesn't expand to fill available space above the tab bar.

## Goals

- Faithfully reproduce all 4 tabs (Home, Presets, Playground, Demos) with matching visual design
- Match the Pulsar design system: navy `#001A72`, light blue `#e1f3fa`, border `#38ACDD`
- Include all 151 preset visualization images
- Port all 7 demo screens
- Implement gesture-based Playground with `bindtouchstart/move/end`
- Ship a single-file `App.tsx` to avoid ReactLynx snapshot errors

## Design System Reference

From `PulsarApp/constants/theme.ts`:

| Token | Value | Usage |
|-------|-------|-------|
| primary | `#001A72` | Titles, active tabs, text, icons |
| background | `#e1f3fa` | Page background |
| card bg | `white` | Card backgrounds |
| card border | `#38ACDD` | Card borders (2px) |
| card shadow | `#38ACDD` | Offset shadow (-3px 3px) |
| secondary text | `#2B85AB` | Subtitles, secondary info |
| tab inactive | `#B5E1F1` | Inactive tab icons/text |
| error/record | `#FF6259` | Error states, record button border |
| success | `#57B495` | Connected state |
| tag bg | `#B5E1F1` | Tag pill background |
| tag text | `#001A72` | Tag pill text |
| font | DM Sans | Primary typeface (fallback to system) |

**Card component pattern:** White bg, 2px `#38ACDD` border, border-radius 4px, padding 15px horizontal / 25px vertical, shadow offset -3px 3px color `#38ACDD`.

**Button pattern:** 2px `#38ACDD` border, white bg, border-radius 4px, padding 18px horizontal / 10px vertical, same offset shadow. Press animation: translate to remove shadow briefly.

## User Stories

### US-001: Design System & CSS Foundation

**Description:** As a developer, I want a CSS file that encodes the Pulsar design system so that all subsequent screens use consistent styling.

**Acceptance Criteria:**
- [ ] `App.css` defines all design tokens as CSS classes matching the design system table above
- [ ] `.page` uses `display: linear; linear-orientation: vertical; background-color: #e1f3fa`
- [ ] `.card` matches: white bg, 2px `#38ACDD` border, border-radius 4px, padding 15px/25px, shadow -3px 3px `#38ACDD`
- [ ] `.button` matches: 2px `#38ACDD` border, white bg, border-radius 4px, padding 18px/10px, same shadow
- [ ] `.tag` matches: `#B5E1F1` bg, `#001A72` text, border-radius 20px, padding 4px 8px
- [ ] Tab bar classes: white bg, border-top, inactive text `#B5E1F1`, active text `#001A72`
- [ ] Title: 32px bold `#001A72`, subtitle: 14px `#2B85AB`
- [ ] All padding/margin uses longhand (no shorthand like `padding: 10px 20px`)
- [ ] No `text-transform` (not supported in Lynx)
- [ ] `npm run build` passes

---

### US-002: Tab Shell & Navigation

**Description:** As a user, I want 4 bottom tabs (Home, Presets, Playground, Demos) so I can navigate between screens.

**Acceptance Criteria:**
- [ ] 4 tabs rendered in bottom tab bar: Home, Presets, Playground, Demos
- [ ] Active tab has `#001A72` text and top border accent
- [ ] Inactive tabs have `#B5E1F1` text
- [ ] Tab content switches via `display: flex/none` (no conditional JSX rendering)
- [ ] All 4 tab panels always exist in the DOM (ReactLynx snapshot constraint)
- [ ] Default active tab is Home
- [ ] Tab bar icons use text labels (Lynx has no SVG icon support)
- [ ] `npm run build` passes

---

### US-003: Home Screen — Welcome & Connection UI

**Description:** As a user, I want to see the Welcome to Pulsar home screen with the connection UI layout so the app matches the original visually.

**Source:** `PulsarApp/app/(tabs)/index.tsx` (647 lines)

**Acceptance Criteria:**
- [ ] Title "Welcome to Pulsar!" in 32px bold `#001A72`
- [ ] Connection indicator badge (pill shape, white bg, `#38ACDD` border) showing "Not connected" with red dot
- [ ] "Connect device" card with:
  - Description text: "Connect your haptic device first..."
  - Text input field (2px `#B5E1F1` border, border-radius 4, placeholder "Connecting code")
  - "Connect" button (card-style with `#38ACDD` border/shadow)
- [ ] Collapsible "How to connect a device?" section with chevron
- [ ] Layout faithful to the screenshot: title at top, badge top-right, card centered
- [ ] Connection logic is stubbed (no WebSocket) — UI only
- [ ] `npm run build` passes

---

### US-004: Presets Screen — List with Search & Tags

**Description:** As a user, I want to browse all haptic presets with search and tag filtering so I can find and play presets.

**Source:** `PulsarApp/app/(tabs)/presets.tsx` (218 lines), `components/Preset.tsx` (315 lines), `components/PresetList.tsx` (132 lines)

**Acceptance Criteria:**
- [ ] Title "Get to know Pulsar presets" in 32px bold
- [ ] Subtitle with haptics support level info
- [ ] Search input field (2px `#5BB9E0` border, white bg, clear X button)
- [ ] Tag filter pills showing active filters (removable, "Clear all" option)
- [ ] Scrollable list of all preset cards rendered via `.map()` inside `<scroll-view>`
- [ ] Each preset card (normal layout) shows:
  - Tag pills (e.g. Bold, Soft, Impulses, Short) in `#B5E1F1` bg
  - Preset name (subtitle style)
  - Description text (14px)
  - Visualization image (from bundled PNGs, 160px height area)
  - Play button that triggers `Presets.xxx()` from `lynx-pulsar`
- [ ] Search filters presets by name/description/tags in real time
- [ ] `npm run build` passes

---

### US-005: Bundle Preset Visualization Images

**Description:** As a developer, I want the 151 preset PNG visualization images bundled so preset cards can display them.

**Source:** `PulsarApp/assets/presets/*.png` (151 files)

**Acceptance Criteria:**
- [ ] All 151 PNG files from `PulsarApp/assets/presets/` copied to `lynx-pulsar-app/src/assets/presets/`
- [ ] An index mapping (object or function) maps preset name → image path
- [ ] Images render in preset cards via `<image>` element
- [ ] Images display at correct aspect ratio within the 160px-height container
- [ ] Bundle size is acceptable (check `npm run build` output)
- [ ] `npm run build` passes

---

### US-006: Preset Tag Filtering System

**Description:** As a user, I want to filter presets by category tags so I can find specific types of haptic patterns.

**Source:** `components/PresetList.tsx` `useFilteredPresets()` hook, `components/SelectedTags.tsx`

**Acceptance Criteria:**
- [ ] Preset data includes tags per preset (e.g. Bold, Soft, Impulses, Short, Substantial, Flexible, Extended)
- [ ] Tapping a tag in a preset card adds it to the active filter
- [ ] Active filter tags appear as removable pills above the list
- [ ] Filtering uses AND across tag groups, OR within groups (matching original logic)
- [ ] "Clear all" button removes all active filters
- [ ] Empty state message when no presets match filters
- [ ] `npm run build` passes

---

### US-007: Playground Screen — Gesture Haptic Pad

**Description:** As a user, I want an interactive gesture pad where tapping and dragging triggers real-time haptic feedback.

**Source:** `PulsarApp/app/(tabs)/playground.tsx` (283 lines), `components/GesturePlayground.tsx` (157 lines)

**Acceptance Criteria:**
- [ ] Title "Playground" in 32px bold
- [ ] "How does it work?" info link
- [ ] Grid background area (CSS-based grid lines, since no SVG in Lynx)
- [ ] "Tap to trigger haptic impulse" instruction text
- [ ] Tap on grid triggers discrete haptic at tap position using `bindtap`
- [ ] Pan/drag on grid triggers continuous haptic feedback using `bindtouchstart/move/end`
- [ ] Visual indicator dot follows finger position (clamped to grid bounds)
- [ ] Three control buttons at bottom:
  - Play/Stop (icon-only button)
  - Record/Stop (full-width red-bordered button)
  - Download (icon-only button, stubbed)
- [ ] Timer display showing recording duration
- [ ] `npm run build` passes

---

### US-008: Playground Recording & Playback

**Description:** As a user, I want to record my gesture haptic patterns and play them back.

**Source:** `PulsarApp/app/(tabs)/playground.tsx`, `components/GesturePlayground.tsx`

**Acceptance Criteria:**
- [ ] Pressing Record starts capturing touch events as a haptic pattern
- [ ] Timer counts up during recording (updates every 100ms)
- [ ] Pressing Stop ends recording
- [ ] Pressing Play replays the recorded pattern with haptic feedback
- [ ] Visual indicator animates during playback to show pattern position
- [ ] State transitions: idle → recording → recorded → playing → idle
- [ ] `npm run build` passes

---

### US-009: Demos Screen — Menu

**Description:** As a user, I want a demos menu showing all 7 interactive demos so I can navigate to each one.

**Source:** `PulsarApp/app/(tabs)/demos/index.tsx` (124 lines)

**Acceptance Criteria:**
- [ ] Title "Haptics demos" in 32px bold
- [ ] Subtitle "Feel them with real use cases."
- [ ] Scrollable list of 7 demo cards, each showing:
  - Demo title (20px subtitle style)
  - Chevron/arrow indicator on the right
  - Card styling (white bg, `#38ACDD` border, -3px 3px shadow)
- [ ] Tapping a demo card switches to that demo's view
- [ ] Demo views are shown inline (no navigation stack in Lynx — use display show/hide)
- [ ] Back button to return to demo menu from any demo
- [ ] `npm run build` passes

---

### US-010: Demo — Buttons

**Description:** As a user, I want a grid of haptic buttons with different patterns so I can feel distinct haptic styles.

**Source:** `PulsarApp/app/(tabs)/demos/buttons-demo.tsx` (105 lines)

**Acceptance Criteria:**
- [ ] 2-column grid of 6 buttons: Tap, Soft, Deep, Double, Knock, Ripple
- [ ] Each button triggers a distinct `PatternComposer` pattern via `usePatternComposer`
- [ ] Button style matches Pulsar card pattern (`#38ACDD` border, shadow)
- [ ] Pattern data matches original (amplitude, frequency, timing values)
- [ ] `npm run build` passes

---

### US-011: Demo — Countdown Timer

**Description:** As a user, I want a countdown timer with haptic ticks so I can feel each second and the final celebration.

**Source:** `PulsarApp/app/(tabs)/demos/countdown-timer-demo.tsx` (160 lines)

**Acceptance Criteria:**
- [ ] Large centered number display (countdown from 7)
- [ ] Start button begins countdown; number updates each second
- [ ] Gentle haptic tick for seconds 7-4
- [ ] Intense haptic tick for seconds 3-1
- [ ] Celebratory double-tap pattern on completion (0)
- [ ] Number turns red for final 3 seconds
- [ ] Reset after completion
- [ ] `npm run build` passes

---

### US-012: Demo — Notification Haptics

**Description:** As a user, I want to see a notification sequence where each notification type has a matching haptic pattern.

**Source:** `PulsarApp/app/(tabs)/demos/notification-haptics-demo.tsx` (170 lines)

**Acceptance Criteria:**
- [ ] "Play All Notifications" button
- [ ] 5 notification cards shown one at a time (1 second each):
  - Success (green left border, `Presets.stamp`)
  - Alert (orange left border, `Presets.peal`)
  - Message (blue left border, `Presets.chime`)
  - Error (red left border, `Presets.buzz`)
  - Reminder (purple left border, `Presets.swell`)
- [ ] Each notification shows emoji + title + message text
- [ ] Haptic plays when each notification appears
- [ ] Cards appear/disappear in sequence
- [ ] `npm run build` passes

---

### US-013: Demo — Dot Loader

**Description:** As a user, I want to see an animated dot loader with rhythmic haptic taps synced to each dot's bounce.

**Source:** `PulsarApp/app/(tabs)/demos/dot-loader-demo.tsx` (139 lines)

**Acceptance Criteria:**
- [ ] 3 dots in a row, animating up and down in a wave (staggered by 220ms)
- [ ] Each dot triggers a haptic tap when it reaches the bottom of its bounce
- [ ] Animation loops continuously
- [ ] Animation uses CSS keyframes or Lynx animation system
- [ ] `npm run build` passes

---

### US-014: Demo — Slider

**Description:** As a user, I want 3 sliders with different haptic tick patterns that trigger as I drag.

**Source:** `PulsarApp/app/(tabs)/demos/slider-demo.tsx` (149 lines)

**Acceptance Criteria:**
- [ ] 3 stacked slider cards: "Quick Tick", "Soft Tick", "Deep Tick"
- [ ] Each slider is a horizontal draggable range (0-100)
- [ ] Haptic tick triggers at each 10% mark (every 10 units)
- [ ] Each slider has different pattern parameters (amplitude, frequency)
- [ ] Slider implemented with `bindtouchstart/move/end` on a track element
- [ ] Visual thumb follows finger position
- [ ] `npm run build` passes

---

### US-015: Demo — Balloon

**Description:** As a user, I want to long-press a balloon to inflate it with escalating haptic feedback until it pops.

**Source:** `PulsarApp/app/(tabs)/demos/balloon-demo.tsx` (296 lines)

**Acceptance Criteria:**
- [ ] 4-cell grid layout, each cell contains a balloon
- [ ] Long press on a balloon starts inflating (progress 0→1)
- [ ] Haptic intensity increases with inflation progress
- [ ] Visual scale animation on balloon during inflation
- [ ] At progress >= 1, balloon "pops" with sharp haptic impulse
- [ ] Balloon fades out after popping, then resets
- [ ] `npm run build` passes

---

### US-016: Demo — Sensor Haptics

**Description:** As a user, I want to tilt my device to move a dot inside a circle, with haptic feedback for movement and collision.

**Source:** `PulsarApp/app/(tabs)/demos/sensor-haptics-demo.tsx` (197 lines)

**Acceptance Criteria:**
- [ ] Circle container with a movable dot inside
- [ ] Device tilt (accelerometer) drives dot position
- [ ] Rolling haptic texture when dot moves (amplitude proportional to velocity)
- [ ] Sharp haptic impulse when dot hits circle boundary
- [ ] Dot bounces elastically off boundary
- [ ] Velocity damping (dot slows down when not actively tilting)
- [ ] Note: Sensor API availability in Lynx needs investigation. If not available, show placeholder with explanation.
- [ ] `npm run build` passes

## Functional Requirements

- FR-1: All UI must be in a single `App.tsx` file (ReactLynx snapshot constraint)
- FR-2: Tab switching must use `display: flex/none`, never conditional JSX rendering
- FR-3: All haptics triggered via `lynx-pulsar` package (`Presets`, `Settings`, `usePatternComposer`)
- FR-4: Scrollable content must use `<scroll-view scroll-orientation="vertical">`
- FR-5: Events use `bindtap` (tap), `bindtouchstart/move/end` (gestures)
- FR-6: All React hooks imported from `@lynx-js/react`, NOT from `react`
- FR-7: CSS uses `display: linear` + `linear-orientation: vertical` for vertical layouts
- FR-8: Preset images bundled as static assets and referenced via `<image>` element
- FR-9: Demo sub-navigation handled inline via state + display toggle (no router)
- FR-10: Version pinning: `@lynx-js/react@0.116.4`, `@lynx-js/react-rsbuild-plugin@0.12.9`, `@lynx-js/rspeedy@0.13.4`

## Non-Goals

- No WebSocket device connection (Lynx runs locally on device with native module)
- No PostHog analytics integration
- No Sentry error tracking
- No Expo-specific features (expo-clipboard, expo-store-review, expo-updates)
- No AsyncStorage persistence
- No React Navigation / Expo Router (manual tab state instead)
- No SVG rendering (use CSS alternatives for grid lines, icons)
- No Reanimated shared values or worklets (use Lynx equivalents where available)
- No onboarding overlay system
- No dark mode support (light theme only, matching original)
- No compact preset layout toggle (normal layout only for initial port)

## Technical Considerations

- **Single file constraint:** All components must live in `App.tsx`. This file will be large (~2000+ lines). Use clearly commented sections.
- **Image bundling:** 151 preset PNGs (~10-50KB each). Check total bundle size after import. May need lazy loading or image optimization.
- **Gesture fidelity:** `bindtouchstart/move/end` provides touch coordinates but not the full gesture recognizer API (no velocity, no long-press duration). Balloon and Playground demos may need simplified interaction models.
- **Sensor API:** Lynx may not expose accelerometer. Sensor demo (US-016) may need a "not available" fallback.
- **Animation:** Lynx supports CSS transitions/animations. Spring physics from Reanimated will need CSS `ease-in-out` approximation.
- **Pattern data:** Demo pattern objects (amplitude/frequency/time arrays) port directly — they're plain JSON passed to `usePatternComposer`.
- **NativeModules threading:** `NativePulsar.ts` has a guard for main-thread evaluation (`{} as PulsarModule` fallback). All haptic calls must be in event handlers or effects, never in render.

## Success Metrics

- All 4 tabs render correctly in LynxExplorer / Lynx P app
- Visual design matches original PulsarApp screenshot (navy/light blue theme, card styling, layout)
- All preset play buttons trigger correct haptic on device
- Playground tap and drag trigger haptic feedback
- All 7 demos function (with noted limitations for sensor demo)
- `npm run build` produces clean output with no errors
- Bundle size remains reasonable (< 2MB including images)

## Open Questions

1. Does Lynx support CSS `@keyframes` animations? (Needed for dot-loader demo)
2. Does Lynx expose accelerometer/gyroscope sensor data? (Needed for sensor demo)
3. Can `<image>` load bundled PNGs from the asset directory, or do they need to be served via URL?
4. Is there a long-press gesture recognizer in Lynx, or must it be built from `bindtouchstart` + timer?
5. What is the practical bundle size limit for LynxExplorer?
