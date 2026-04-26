# Lynx Pulsar App — Agent Knowledge Base

## REQUIRED READING

Before working on this project, read: https://lynxjs.org/next/llms.txt
This is the official Lynx guide for AI agents covering all core concepts.

## Source Reference

Port of `PulsarApp/` (repo root) — the official Pulsar demo app by Krzysztof Piaskowy (Software Mansion).

## Lynx Core Concepts (from llms.txt)

### Dual-Thread Architecture
- Code runs on TWO threads: main thread (first-screen rendering) and background thread (React logic, effects, events)
- `NativeModules`, `setTimeout`, `setInterval`, `fetch` are **background-thread-only**
- Event handlers (`bindtap`, etc.) run on background thread
- Functions using background-only APIs need `'background only'` directive (though ReactLynx can infer direct cases)

### Layout System — 4 Modes
| Mode | Notes |
|------|-------|
| `display: linear` | Vertical by default. Use `linear-weight` (NOT `flex`). Simplest/fastest. |
| `display: flex` | Standard flexbox. **Default direction is `row`** (not column!). |
| `display: grid` | Supported but limited (no `grid-area`). |
| `display: relative` | Mobile-only Android RelativeLayout model. |

**Critical rules:**
- Every element is `box-sizing: border-box` by default
- No `inline` vs `block` — all elements are block-level
- `overflow: scroll` is **UNSUPPORTED** — use `<scroll-view scroll-y />` or `<scroll-view scroll-x />`
- `position` supports `relative`, `absolute`, `fixed`
- CSS properties do **NOT inherit** by default (opt-in via config)

### Styling
- All CSS length values MUST have units (`16px`, not `16`). Exception: `0`.
- Supports `rpx` unit for responsive sizing
- `text-transform` is NOT supported
- No `useLayoutEffect` — use `main-thread:bindlayoutchange` instead

### Elements
- `<view>` — generic container (maps to UIView/ViewGroup)
- `<text>` — text MUST be inside `<text>` elements (no bare text in views)
- `<image>` — `src` attribute, supports `mode="aspectFit|aspectFill|scaleToFill|center"`
- `<scroll-view>` — scrollable container, use `scroll-y` or `scroll-x` attribute (NOT `scroll-orientation`)
- `<input>` — text input, `bindinput` event gives `{detail: {value}}`
- `<list>` — high-performance virtualized list

### Events
- `bindtap` (tap), `catchtap` (tap + stop propagation)
- `bindtouchstart`, `bindtouchmove`, `bindtouchend` (touch)
- Main-thread events: `main-thread:bindtap` (for zero-delay response)
- Background-thread events receive plain JSON (no DOM refs)

### TypeScript
- Set `jsx: "react-jsx"` and `jsxImportSource: "@lynx-js/react"` in tsconfig
- Types from `@lynx-js/types`, React APIs from `@lynx-js/react`

## Lynx CSS — Hard-Won Lessons

### 1. `display: flex` defaults to `flex-direction: row`
Unlike CSS on web where `flex-direction` defaults to `row`, many developers assume `column`. In Lynx this is also `row` by default. **Always explicitly set `flex-direction: column`** for vertical layouts.

### 2. Show/hide pattern: `position: absolute` + `zIndex` (CONFIRMED WORKING)
`display: none` alone does NOT reliably hide elements in Lynx flex containers. The working pattern uses absolute positioning + zIndex:

```css
.tab-content { flex: 1; position: relative; }
.tab-panel {
  position: absolute;
  top: 0; left: 0;
  width: 100%; height: 100%;
  background-color: #e1f3fa;
}
```
```tsx
<view className="tab-panel" style={{
  display: active ? "flex" : "none",
  flexDirection: "column",
  zIndex: active ? 10 : 0
}}>
```
Apply the same pattern for ANY nested show/hide (e.g. demo sub-views within the Demos tab).

### 3. NEVER use `key` to force remount or `display:none` inside `.map()`
Both cause `snapshotPatchApply` / `insertBefore` crashes. Instead:
- Use `opacity: 0/1` + `position: absolute` + `zIndex` to show/hide elements within a list
- Never use dynamic `key` to trigger re-render animations — the main thread snapshot can't handle element insertion/removal

### 4. ALL CSS length values MUST have `px` units
```tsx
// WRONG
style={{ marginTop: 24 }}
// CORRECT
style={{ marginTop: "24px" }}
```

### 4. `flex: 1` does NOT work with `display: linear`
Use `linear-weight: 1` instead, or switch to `display: flex`.

### 5. `<scroll-view>` uses `scroll-y` NOT `scroll-orientation`
```tsx
// WRONG
<scroll-view scroll-orientation="vertical">
// CORRECT
<scroll-view scroll-y>
```

### 6. `<image>` needs explicit pixel dimensions (not percentage)
```tsx
// WRONG — width: "100%" may not resolve
<image src={url} style={{ width: "100%", height: "160px" }} />
// CORRECT — explicit pixel dimensions
<image src={url} style={{ width: "350px", height: "160px" }} />
```
Import images with plain imports (no `?inline` needed):
```tsx
import myImg from "./assets/foo.png";
<image src={myImg} style={{ width: "200px", height: "100px" }} />
```
Rspeedy dev server automatically sets the correct absolute URL prefix.

## ReactLynx Constraints

1. **No conditional JSX** — use `display: flex/none` for show/hide
2. **Single file preferred** — keep components in `App.tsx` to avoid snapshot errors
3. **`.map()` works** inside `<scroll-view>`
4. **Imports**: `useState`, `useEffect`, `useRef` from `@lynx-js/react`
5. **NativeModules**: Background-thread-only. Guard with `typeof NativeModules !== 'undefined'`

## Project Setup

- Config: `lynx.config.ts` with `pluginReactLynx()` + `pluginQRCode()`
- Versions: `@lynx-js/react@0.116.4`, `@lynx-js/react-rsbuild-plugin@0.12.9`, `@lynx-js/rspeedy@0.13.4`
- Dependency: `"lynx-pulsar": "file:../lynx-pulsar"`
- Commands: `npm run dev`, `npm run build`

## Design System (from PulsarApp/constants/theme.ts)

| Token | Value | Usage |
|-------|-------|-------|
| `primary` | `#001A72` | Navy — titles, active tab |
| `background` | `#e1f3fa` | Light blue — page bg |
| `card border` | `#38ACDD` | Card borders (2px) |
| `secondary text` | `#2B85AB` | Subtitles |
| `tab inactive` | `#B5E1F1` | Inactive tabs |
| `error` | `#FF6259` | Error/record |
