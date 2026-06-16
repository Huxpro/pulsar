# Lynx Pulsar Demo App — Port Plan

## Goal

Port the React Native `PulsarApp` (at `react-native/PulsarApp/`) to Lynx, matching its UI and functionality as closely as possible.

## Source Reference Files

- `react-native/PulsarApp/App.tsx` — Tab shell (3 tabs, bottom tab bar)
- `react-native/PulsarApp/src/screens/PresetsScreen.tsx` — 170+ preset list
- `react-native/PulsarApp/src/screens/RealtimeComposerScreen.tsx` — Gesture haptic pad
- `react-native/PulsarApp/src/screens/PublicApisScreen.tsx` — Settings & pattern composer API testing

## Target

`lynx/lynx-pulsar-demo/` — single Rspeedy project, already scaffolded and building.

## Design Spec (match the RN app exactly)

- Light theme: background `#f5f5f5`
- White card rows: `background: white`, `padding: 16px`, `border-radius: 12px`, subtle shadow
- Accent color: `#007AFF` (iOS system blue)
- Tab bar at bottom: white, `border-top: 1px solid #e0e0e0`, icons + labels
- Title: `font-size: 28px`, `font-weight: bold`, `color: #333`
- Subtitle: `font-size: 14px`, `color: #666`
- Play button: `background: #007AFF`, white text, `border-radius: 8px`, `padding: 10px 20px`
- API buttons: white card, title (16px bold) + subtitle (12px monospace gray), optional status badge

## Architecture Constraints (ReactLynx)

1. **No conditional JSX rendering** — use `style={{ display: condition ? "flex" : "none" }}` instead of `{condition && <X/>}` or ternary. The snapshot system requires deterministic structure.
2. **`.map()` works** — official lynx-examples use it fine. Our earlier snapshot error was caused by multi-file component imports + conditional rendering, not by map.
3. **Single file preferred** — keep all components in `App.tsx` to avoid snapshot cross-module issues. Helper components defined in the same file are fine.
4. **No `text-transform` in CSS** — Lynx doesn't support it.
5. **Use `display: linear` with `linear-orientation`** or `display: flex` for layout.
6. **Use `scroll-view` with `scroll-orientation="vertical"`** for scrollable content.
7. **Events**: use `bindtap` instead of `onPress`/`onClick`.
8. **Imports**: `useState`, `useEffect`, `useRef`, `useCallback` from `@lynx-js/react`.

## Implementation Steps

### Step 1: CSS file (`App.css`)

Rewrite to match the RN app's visual design:
- `.page` — full-screen container, `#f5f5f5` bg
- `.tab-bar` — bottom bar, white, row layout, border-top
- `.tab` / `.tab-active` — tab button styles
- `.tab-icon` / `.tab-text` / `.tab-text-active` — icon + label
- `.screen-container` — flex:1 wrapper for each tab
- `.scroll-content` — padding: 20px
- `.title` — 28px bold #333
- `.subtitle` — 14px #666
- `.preset-row` — white card, row layout, space-between
- `.preset-name` — 16px #333
- `.play-button` / `.play-button-text` — blue button
- `.section` / `.section-title` — section headers
- `.api-button` / `.api-button-title` / `.api-button-subtitle` — API card
- `.status-badge` / `.status-badge-text` — gray pill
- `.status-box` — blue-left-border info box

### Step 2: App component structure (`App.tsx`)

```
<view class="page">
  <!-- Tab content: all 3 tabs rendered, show/hide via display -->
  <view style="display: activeTab === 'presets' ? 'flex' : 'none'">
    ...PresetsScreen inline...
  </view>
  <view style="display: activeTab === 'apis' ? 'flex' : 'none'">
    ...PublicApisScreen inline...
  </view>
  <view style="display: activeTab === 'realtime' ? 'flex' : 'none'">
    ...Placeholder...
  </view>

  <!-- Bottom tab bar -->
  <view class="tab-bar">
    <view bindtap=setTab('presets')>...</view>
    <view bindtap=setTab('realtime')>...</view>
    <view bindtap=setTab('apis')>...</view>
  </view>
</view>
```

### Step 3: Presets tab

- Render ALL 170+ presets using `.map()` over a static array
- Each item: `<view className="preset-row" bindtap={...}> <text>{name}</text> <view class="play-button">Play</view> </view>`
- The preset array is identical to `react-native/PulsarApp/src/screens/PresetsScreen.tsx` lines 19-181
- No worklet — just call `Presets.xxx()` directly in bindtap handler

### Step 4: Public APIs tab

Port all sections from `PublicApisScreen.tsx`:
- **Settings section**: enableHaptics, enableSound, enableCache, clearCache, preloadPresets, stopHaptics, shutDownEngine, enableImpulseCompositionMode (toggles with state)
- **Haptic Support section**: getHapticsSupportLevel, forceHapticsSupportLevel (5 level buttons)
- **Pattern Composer section**: parsePattern, playPattern, releasePattern (with patternId tracking)
- **Status display**: show last action text in a blue info box

### Step 5: Realtime Composer tab (placeholder)

Show a centered message:
```
"Realtime Composer"
"Coming in Phase 2"
"Requires gesture events and useRealtimeComposer hook"
```

Use the same title/subtitle styling as other screens.

### Step 6: Verify

- `npm run build` passes
- `npm run dev` serves the bundle
- Load in Lynx P app on device — no snapshot errors
- All preset buttons trigger haptics
- All API buttons work (settings, support level, pattern composer)
- Tab switching works

## Files to Modify

| File | Action |
|------|--------|
| `src/App.tsx` | Complete rewrite — full app with all 3 tabs inline |
| `src/App.css` | Complete rewrite — light theme matching RN styles |
| `src/index.tsx` | Keep as-is (entry point) |
| `src/PresetsScreen.tsx` | Delete (merged into App.tsx) |
| `src/PublicApisScreen.tsx` | Delete (merged into App.tsx) |

## Out of Scope

- `useRealtimeComposer` — not included in lynx-pulsar (phase 2)
- `useAdaptiveHaptics` — not included in lynx-pulsar (phase 2)
- Gesture-driven haptic pad UI (requires touch event integration not yet built)
- Sound playback
