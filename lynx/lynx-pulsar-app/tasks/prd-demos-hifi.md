# PRD: High-Fidelity Demo Screens

## Introduction

Rewrite the 6 demo screens in `lynx-pulsar-app` to faithfully match the original PulsarApp demos. The current implementations are functional placeholders — this PRD upgrades them to high-fidelity ports with correct animations, interactions, and visual design.

Scope: 6 demos (Buttons, Countdown, Notification, Dot Loader, Slider, Balloon). The Sensor/Accelerometer demo is **skipped** (API not available in Lynx). The Balloon demo **keeps our emoji approach** but improves the interaction.

## Goals

- Match the original PulsarApp demo UI and interactions as closely as Lynx allows
- All interactive buttons use the 3D shadow + press-down effect
- Proper CSS keyframe animations where the original uses Reanimated
- Real slider component with layout-aware touch tracking
- Spring-like card entrance animations for notifications
- Number transition animation for countdown

## User Stories

### DS-001: Buttons Demo — 3D Press Effect

**Description:** As a user, I want each haptic button to have the 3D shadow and press-down animation so it matches the original app.

**Source:** `PulsarApp/app/(tabs)/demos/buttons-demo.tsx`

**Acceptance Criteria:**
- [ ] Title "Buttons haptics grid" with subtitle "Tap each button to feel a different haptic pattern."
- [ ] 2-column grid with 20px row gap between rows
- [ ] Each button has `box-shadow: -3px 3px 0px #38ACDD` (3D effect)
- [ ] On tap, button translates `-3px, 3px` and shadow goes to `0px 0px 0px` (press-down), then returns after 200ms
- [ ] Each button triggers its distinct pattern via `usePatternComposer`
- [ ] Pattern data matches original exactly (amplitude, frequency, timing)
- [ ] `npm run build` passes

---

### DS-002: Countdown Timer — Number Transition Animation

**Description:** As a user, I want the countdown number to have a fade/scale transition when it changes, with the red warning color for the final 3 seconds.

**Source:** `PulsarApp/app/(tabs)/demos/countdown-timer-demo.tsx`

**Acceptance Criteria:**
- [ ] Title "Countdown timer" with subtitle "Experience haptic feedback synced to a countdown timer."
- [ ] Large centered number in a white rounded card (borderRadius 16px, paddingVertical 30px)
- [ ] Number shows `...` before starting, counts 7→0 during countdown
- [ ] Number has CSS transition or animation on change (fade-in-up effect) — use CSS `@keyframes` for scale+opacity transition
- [ ] Number turns red (`#FF3B30`) for the last 3 seconds (3, 2, 1)
- [ ] Status text below: "Ready to start" / "X seconds left" / "Complete!"
- [ ] Button label toggles: "Start Countdown" vs "Reset"
- [ ] Gentle haptic tick for seconds 7→4, intense tick for 3→1, celebration double-tap at 0
- [ ] Timer resets to `...` state after completion (not auto-restart)
- [ ] `npm run build` passes

---

### DS-003: Notification Haptics — Spring Card Entrance

**Description:** As a user, I want notification cards to slide in with a spring-like animation when they appear, matching the original app's `FadeInDown.springify()` effect.

**Source:** `PulsarApp/app/(tabs)/demos/notification-haptics-demo.tsx`

**Acceptance Criteria:**
- [ ] Title "Notification Haptics" with subtitle about unique haptic patterns
- [ ] "Play All Notifications" button with 3D press effect
- [ ] Notification display area with minimum height (80px) centered
- [ ] Each notification appears ONE AT A TIME (not all visible simultaneously) — only the current notification is shown
- [ ] Each card slides in from below with a spring-like CSS animation (`@keyframes` translateY + opacity, overshoot effect)
- [ ] Card has colored left border (4px): green/orange/blue/red/purple
- [ ] Title text colored to match the border
- [ ] Haptic plays on each card appearance (stamp, peal, chime, buzz, swell)
- [ ] 1 second per notification, then next one replaces it
- [ ] After all 5, display area clears
- [ ] `npm run build` passes

---

### DS-004: Dot Loader — CSS Keyframe Wave Animation

**Description:** As a user, I want the 3 dots to bounce in a proper wave pattern using CSS keyframe animation (not JS setInterval), with haptic taps synced to the bottom-hit point.

**Source:** `PulsarApp/app/(tabs)/demos/dot-loader-demo.tsx`

**Acceptance Criteria:**
- [ ] Title "Wavy Dot Loader" with subtitle about wave pattern and haptic feedback
- [ ] 3 dots (12px, navy `#001A72`, border-radius 50%) centered horizontally with 20px spacing
- [ ] CSS `@keyframes` animation matching original timing:
  - 0%: translateY(0) — rest position
  - 14%: translateY(-30px) — peak up
  - 28%: translateY(0) — back to rest
  - 100%: translateY(0) — rest (long pause)
- [ ] Animation duration: 1500ms per cycle, infinite loop
- [ ] Staggered by 220ms delay between dots (dot 0: 0ms, dot 1: 220ms, dot 2: 440ms)
- [ ] Haptic tap fires when each dot hits the bottom (at 21% of cycle = 315ms into each cycle)
- [ ] Each dot has its own pattern with slightly different amplitude/frequency
- [ ] Replace current JS `setInterval` animation with CSS keyframes
- [ ] `npm run build` passes

---

### DS-005: Haptic Sliders — Real Touch-Based Slider

**Description:** As a user, I want 3 sliders that respond precisely to my finger position on the track, with haptic ticks at each 10% mark.

**Source:** `PulsarApp/app/(tabs)/demos/slider-demo.tsx`

**Acceptance Criteria:**
- [ ] Title "Slider haptics" with subtitle about haptic characteristics
- [ ] 3 slider cards in the Pulsar card style (white bg, #38ACDD border, 3D shadow)
- [ ] Each slider: "Quick Tick", "Soft Tick", "Deep Tick"
- [ ] Slider track: 6px height, `#B5E1F1` background, rounded
- [ ] Slider fill: `#38ACDD`, matches track height, rounded
- [ ] Slider thumb: 28px circle, navy `#001A72`, vertically centered on track
- [ ] Touch tracking uses `main-thread:bindlayoutchange` or element ref to get actual track width — NOT hardcoded 320px
- [ ] `bindtouchstart` and `bindtouchmove` compute percentage from touch position relative to track bounds
- [ ] Haptic tick triggers when crossing a 10% boundary (not on every move)
- [ ] Each slider has different pattern parameters matching the original
- [ ] Percentage label shows current value
- [ ] `npm run build` passes

---

### DS-006: Balloon Pop — Polish Emoji Interaction

**Description:** As a user, I want the balloon demo to feel polished with smooth inflation progress, escalating haptics, and a satisfying pop animation — keeping our emoji approach.

**Current state:** Already implemented with emoji balloons, long-press inflate, escalating haptics, and pop+reset. This story polishes the existing implementation.

**Acceptance Criteria:**
- [ ] Title and subtitle match original intent
- [ ] 4-cell grid, each cell has Pulsar card style (white bg, #38ACDD border, 3D shadow)
- [ ] Balloon emoji scales smoothly from 0.5→1.3 during inflation
- [ ] Progress percentage text below balloon
- [ ] Haptic escalation: selection (0-50%), impactLight (50-90%), impactMedium (90-99%), impactHeavy (100% = pop)
- [ ] On pop: "POP!" text with red color, card briefly flashes
- [ ] Auto-reset after 1.5 seconds
- [ ] Deflation on finger release (current behavior — keep it)
- [ ] `npm run build` passes

## Functional Requirements

- FR-1: All demo buttons use the 3D `box-shadow: -3px 3px 0px #38ACDD` effect with press animation
- FR-2: CSS `@keyframes` for dot-loader wave, notification slide-in, and countdown number transition
- FR-3: Slider track width computed from actual element layout, not hardcoded
- FR-4: All haptic patterns use exact values from the original app
- FR-5: All inline style values use string `"px"` units
- FR-6: Demo sub-panels use `position: absolute` + `zIndex` show/hide pattern

## Non-Goals

- No accelerometer/sensor demo (API not available)
- No Reanimated shared values (use Lynx-compatible alternatives)
- No gesture handler library (use `bindtouchstart/move/end`)
- No `useLayoutEffect` (use `main-thread:bindlayoutchange` for layout measurement)

## Technical Considerations

- **CSS Keyframes in Lynx**: Supported. Use inline `animationName` object syntax (same as Reanimated's `animationName` style property). See dot-loader source for the pattern.
- **Slider track measurement**: Use `main-thread:bindlayoutchange` event on the track element to get its width, then compute percentage from touch pageX relative to the track's position.
- **Spring animation**: CSS can approximate spring with an overshoot keyframe: `0%: translateY(30px), opacity(0)` → `70%: translateY(-5px), opacity(1)` → `100%: translateY(0), opacity(1)`.
- **Number transition**: On each countdown tick, the number view can trigger a CSS animation by toggling a key or class.

## Success Metrics

- Each demo visually matches the original PulsarApp within Lynx constraints
- All haptic patterns fire at the correct moments
- Animations are smooth (60fps CSS keyframes, not JS-driven where possible)
- All 6 demos accessible from the Demos menu with back navigation
