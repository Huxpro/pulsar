# Lynx Pulsar Vue — Agent Knowledge Base

Vue Lynx port of the official Pulsar demo app. This is the **Vue 3 / Vue Lynx**
sibling of `lynx-pulsar-app` (which is the **ReactLynx** port of `PulsarApp/`).

## REQUIRED READING

Before working on this project, read the Vue Lynx docs entry point for agents:
→ https://vue.lynxjs.org/llms.txt

It links every Vue Lynx guide (quick-start, reactivity, events, v-model,
main-thread scripting, etc.). This project was scaffolded from the official
`npm create vue-lynx@latest` template (`create-vue-lynx`, TS variant).

## What this is

A faithful 1:1 port of `lynx-pulsar-app/src/App.tsx` (ReactLynx) to a single
`src/App.vue` (Vue Composition API). Same four-tab structure, same haptic
behavior, same design system. Reuses the exact same `App.css`, preset images,
`presetData.ts`, and `presetImages.ts` from the React port — only the component
layer was rewritten in Vue.

```
lynx-pulsar-vue/
├── lynx.config.ts        # Rspeedy config: pluginVueLynx() + pluginQRCode()
├── package.json
├── tsconfig*.json        # project-references layout from the official template
├── src/
│   ├── index.ts          # createApp(App).mount()  (NOT root.render)
│   ├── App.vue           # the whole app — <script setup> + <template>
│   ├── App.css           # copied verbatim from lynx-pulsar-app
│   ├── pulsar.ts         # native module access + pattern composer (Vue-side)
│   ├── presetData.ts     # copied (imports Presets from ./pulsar)
│   ├── presetImages.ts   # copied (name → inlined PNG)
│   ├── shims-vue.d.ts    # *.vue and *.png module declarations
│   ├── rspeedy-env.d.ts
│   └── assets/{presets,icons}/*.png
```

## Critical version pinning (Rsbuild v1, NOT v2)

`vue-lynx@0.4.0` is built against **Rsbuild v1** (`@rsbuild/core ^1.0.0`,
`@rsbuild/plugin-vue ^1.2.6`). The latest `@lynx-js/rspeedy@0.15` ships
**Rsbuild v2**, which is incompatible and fails the build with:

> Rspeedy manages the SWC compilation target via `env`, which is mutually
> exclusive with `jsc.target` … (received `"es2019"`)

So this project pins:

| Package | Version | Why |
|---------|---------|-----|
| `@lynx-js/rspeedy` | `0.14.5` | last 0.14.x — uses `@rsbuild/core` **1.7.5** |
| `@lynx-js/qrcode-rsbuild-plugin` | `0.4.7` | last 0.4.x — Rsbuild v1 era |
| `@rsbuild/plugin-vue` | `^1.2.6` | matches `vue-lynx` peer (Rsbuild v1) |
| `vue-lynx` | `^0.4.0` | the framework |
| `vue` | `^3.5.38` | runtime |

If you bump `vue-lynx` to a release that targets Rsbuild v2, bump
`@lynx-js/rspeedy` to a matching `0.15+` and drop `@rsbuild/plugin-vue` to a v2
(`^2`) at the same time.

## Vue Lynx vs ReactLynx — porting notes

| ReactLynx | Vue Lynx |
|-----------|----------|
| `root.render(<App/>)` | `createApp(App).mount()` |
| `useState(x)` → `[v, setV]` | `ref(x)`, read/write `.value` |
| `useRef(x)` (persist, no rerender) | **plain `let`/`const`** — `setup()` runs once |
| `useEffect(fn, [])` | `onMounted(fn)` |
| derived value functions | `computed(() => …)` |
| `bindtap` / `onClick` | `@tap` |
| `bindtouchstart/move/end` | `@touchstart/@touchmove/@touchend` |
| `bindinput={e=>e.detail.value}` | `@input="e => x = e.detail.value"` (or `v-model`) |
| `bindlayoutchange` | `@layoutchange` |
| `{cond && <X/>}` / `{a ? <X/> : null}` | `v-if` / `v-show` |
| `arr.map(x => <X/>)` | `v-for="x in arr" :key="…"` |
| `className={`a ${b?'c':''}`}` | `class="a" :class="{ c: b }"` |
| `style={{marginTop:'8px'}}` | `:style="{ marginTop: '8px' }"` |
| imports from `@lynx-js/react` | imports from `vue-lynx` |

**Setup-runs-once is the big simplifier.** Every `useRef` in the React version
(socket, timers, recorded-event arrays, slider ticks, tracked layout) becomes a
plain mutable closure variable — no `.current`, no cleanup tied to render.

**Tab/demo show-hide.** Kept the React port's proven Lynx pattern: panels stay
mounted and toggle `display: flex/none` + `zIndex` via `:style`, rather than
`v-if`. State lives in top-level refs so nothing is lost when a panel is hidden.

## The Pulsar bridge (`src/pulsar.ts`)

- Re-exports `Presets` / `Settings` by importing the **React-free** source
  modules directly: `lynx-pulsar/src/Presets`, `lynx-pulsar/src/Settings`,
  `lynx-pulsar/src/NativePulsar`. Importing the package index (`lynx-pulsar`)
  instead would pull in `usePatternComposer`/`useRealtimeComposer`, which
  `import … from '@lynx-js/react'` and break the Vue build with
  *"Can't resolve '@lynx-js/react'"*.
- `createPatternComposer(pattern?)` is the framework-agnostic replacement for the
  ReactLynx `usePatternComposer` hook — a closure over the parsed pattern id with
  `{ parse, play, stop, isParsed }`. Parse patterns in `onMounted`, call `play()`
  from handlers.
- `NativeModules.PulsarModule` is background-thread-only (same as ReactLynx). All
  calls happen inside `@tap`/`@touch*` handlers and lifecycle hooks, which run on
  the background thread, so the guard never returns the empty stub at call time.

## Known platform gaps (carried over from the React port)

- **Home tab is hidden** — the "Connect device" pairing flow needs `WebSocket`,
  which Lynx's background thread does not expose yet. The full Home UI + socket
  state machine is ported and intact (typed loosely), just not surfaced in the
  tab bar. Re-enable by adding the Home `<view>` back to `.tab-bar` and flipping
  the default `activeTab` to `'home'`.
- **Sensor Haptics demo** uses a touch fallback — no accelerometer API in Lynx.

## Commands

```bash
npm install          # pinned Rsbuild-v1 toolchain (see table above)
npm run dev          # Rspeedy dev server — scan the QR in LynxExplorer
npm run build        # outputs dist/main.lynx.bundle (+ web)
npm run preview      # preview the production build
```

The bundle is ~3.3 MB because every preset PNG is inlined as a data URI
(`output.dataUriLimit` in `lynx.config.ts`) so the `.lynx` bundle is
self-contained in the Lynx Pulsar host — identical strategy to `lynx-pulsar-app`.
