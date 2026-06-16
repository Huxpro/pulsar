# Pulsar — Lynx Port

A ReactLynx port of [Software Mansion's Pulsar](https://github.com/software-mansion/pulsar) haptics app. 151 hand-crafted haptic presets, a pattern composer, and a realtime composer — driven by the native iOS `CoreHaptics` SDK through a Lynx `NativeModule`.

This directory (`lynx/lynx-pulsar-app/`) is the polished demo app. The sibling `lynx/lynx-pulsar/` is the Lynx adapter library it depends on, mirroring the React Native TurboModule shipped at `react-native/react-native-pulsar/`.

---

## One-Shot Build Prompt (for an AI agent)

> You are building the Pulsar Lynx app and launching it on the **already-booted iOS Simulator**. Follow these steps in order, halt on any error, and report progress concisely.
>
> 1. `cd lynx/lynx-pulsar && npm install`
> 2. `cd ../lynx-pulsar-app && npm install`
> 3. Confirm the iOS Simulator is booted: `xcrun simctl list devices booted` — abort if none.
> 4. Locate a `LynxExplorer.app` build for iphonesimulator. Check `~/github/lynx-pulsar-explorer/explorer/darwin/ios/lynx_explorer/build/Build/Products/Debug-iphonesimulator/LynxExplorer.app` first; if absent, follow `lynx/AGENTS.md → LynxExplorer Integration (iOS)` to build it (heavy: ~30 min first time due to PrimJS pod download).
> 5. `xcrun simctl install booted <path-to>/LynxExplorer.app`
> 6. Start the bundler in the background: `cd lynx/lynx-pulsar-app && npm run dev`. Wait until it prints `Lynx http://<host>:<port>/main.lynx.bundle`. Capture `<port>` (defaults to 3000, rolls to 3003 if taken).
> 7. **Swap the homepage bundle so LynxExplorer auto-loads Pulsar on launch.** Pulsar's assets are referenced via HTTP and `NSAllowsArbitraryLoads` is enabled in the host, so the dev server serves the images:
>    ```bash
>    APP_BUNDLE=$(xcrun simctl get_app_container booted com.huxpro.lynx.pulsar)
>    cp "$APP_BUNDLE/Resource/homepage.lynx.bundle" /tmp/homepage.lynx.bundle.bak  # restore later
>    curl -s "http://127.0.0.1:<port>/main.lynx.bundle" -o "$APP_BUNDLE/Resource/homepage.lynx.bundle"
>    ```
> 8. Launch:
>    ```bash
>    xcrun simctl terminate booted com.huxpro.lynx.pulsar 2>/dev/null
>    xcrun simctl launch booted com.huxpro.lynx.pulsar
>    sleep 4
>    ```
> 9. Verify success: take a screenshot, resize, and read it:
>    ```bash
>    xcrun simctl io booted screenshot /tmp/pulsar-verify.png
>    sips -Z 900 /tmp/pulsar-verify.png --out /tmp/pulsar-verify-small.png
>    ```
>    The Home tab should show `Welcome to Pulsar!`, a "Connect device" card with a "Connecting code" field, and a four-icon bottom tab bar (Home / Presets / Playground / Demos). Halt if the screenshot still shows the white "Bundle URL" card — that means the swap was bypassed (likely a stale install).
> 10. Cleanup hint for the user: `cp /tmp/homepage.lynx.bundle.bak "$APP_BUNDLE/Resource/homepage.lynx.bundle"` restores the original Lynx Explorer home card.
>
> Do not modify `iOS/`, `Android/`, or `react-native/` — those are upstream sources. If a step fails, read the **Troubleshooting** section below before retrying. Stop and ask the user if a step needs credentials or a destructive action.
>
> Do not modify `iOS/`, `Android/`, or `react-native/` — those are upstream sources. If the build fails, read the **Troubleshooting** section below before retrying. Stop and ask the user if a step needs credentials or a destructive action.

---

## What this is

- **`lynx/lynx-pulsar/`** — the Lynx adapter library. Mirrors `react-native/react-native-pulsar/`:
  - `src/` — TypeScript surface (`NativePulsar`, `Presets`, `usePatternComposer`, `useRealtimeComposer`, …)
  - `ios/PulsarLynxModule.{h,m}` — Objective-C bridge to the Pulsar Swift SDK
  - `android/` — Kotlin module (`PulsarLynxModule.kt`)
  - `deps/Pulsar/Sources/Pulsar/` — vendored Swift SDK sources
- **`lynx/lynx-pulsar-app/`** — the polished demo (this folder):
  - `src/App.tsx` (~1.3k LOC) — Home / Presets / Playground / Demos
  - `src/App.css` (~1k LOC) — Pulsar palette + layout
  - `src/assets/presets/*.png` — 151 preset thumbnails
  - `src/assets/icons/*.png` — tab bar icons
- **Runtime** — the JS bundle is loaded by **LynxExplorer.app**, an iOS host that registers `PulsarLynxModule` natively so JS calls cross into `CoreHaptics`.

## Prerequisites

- macOS with Xcode 15+ (for the iOS Simulator and `xcrun`)
- Node 18+, npm 9+
- A booted iOS Simulator (the build target is iPhone 17 Pro, simulator id `EABC0BC7-12FE-4940-969C-FF3D6B9135F5`; any iPhone running iOS 15+ works)
- **For the native shell** (one-time, ~30 min): the `lynx-stack` monorepo cloned and a worktree at `~/github/lynx-pulsar-explorer` with `pod install` completed. See `lynx/AGENTS.md → LynxExplorer Integration (iOS)`.

## Quick start (with a pre-built LynxExplorer.app)

```bash
# 1. Install adapter + app deps
( cd lynx/lynx-pulsar && npm install )
( cd lynx/lynx-pulsar-app && npm install )

# 2. Install the host onto the booted simulator
xcrun simctl install booted \
  ~/github/lynx-pulsar-explorer/explorer/darwin/ios/lynx_explorer/build/Build/Products/Debug-iphonesimulator/LynxExplorer.app

# 3. Start the bundler (background) — note the URL it prints, port defaults to 3000 but rolls to 3003 if taken
( cd lynx/lynx-pulsar-app && npm run dev ) &

# 4. Swap LynxExplorer's bundled homepage with Pulsar so it auto-loads
APP_BUNDLE=$(xcrun simctl get_app_container booted com.huxpro.lynx.pulsar)
cp "$APP_BUNDLE/Resource/homepage.lynx.bundle" /tmp/homepage.lynx.bundle.bak
curl -s "http://127.0.0.1:3003/main.lynx.bundle" -o "$APP_BUNDLE/Resource/homepage.lynx.bundle"

# 5. Launch & screenshot
xcrun simctl terminate booted com.huxpro.lynx.pulsar 2>/dev/null
xcrun simctl launch booted com.huxpro.lynx.pulsar
sleep 4
xcrun simctl io booted screenshot /tmp/pulsar-verify.png
sips -Z 900 /tmp/pulsar-verify.png --out /tmp/pulsar-verify-small.png
open /tmp/pulsar-verify-small.png

# 6. (Optional) Restore Lynx Explorer's original home card
cp /tmp/homepage.lynx.bundle.bak "$APP_BUNDLE/Resource/homepage.lynx.bundle"
```

## Full path (building LynxExplorer from scratch)

The native host depends on the `lynx-stack` monorepo because the Lynx C++ pods are referenced via `:path`. The full procedure lives in **`lynx/AGENTS.md`** under *LynxExplorer Integration (iOS)*. Highlights:

1. Clone `lynx-infra/lynx` into `~/github/lynx`.
2. Create a worktree: `git worktree add ~/github/lynx-pulsar-explorer pulsar-explorer`.
3. Copy the Pulsar Swift sources into `LynxExplorer/modules/Pulsar/`.
4. Drop `PulsarLynxModule.{h,m}` into `LynxExplorer/modules/` and register it in `LynxInitProcessor.m`.
5. Set `SWIFT_VERSION = 5.0`, `IPHONEOS_DEPLOYMENT_TARGET = 15.0`, bundle id `com.huxpro.lynx.pulsar`.
6. `bundle exec pod install` (~20-30 min the first time).
7. `xcodebuild -workspace LynxExplorer.xcworkspace -scheme LynxExplorer -destination 'platform=iOS Simulator,id=EABC0BC7-12FE-4940-969C-FF3D6B9135F5' build`.

## Verification checklist

A successful build shows all four below:

- [ ] `dist/main.lynx.bundle` exists after `npm run dev` (or `npm run build`).
- [ ] `curl -sI http://127.0.0.1:<port>/main.lynx.bundle` returns `200`.
- [ ] `xcrun simctl get_app_container booted com.huxpro.lynx.pulsar` resolves a path.
- [ ] After launch, the simulator shows `Welcome to Pulsar!` and the four-icon bottom tab bar (Home / Presets / Playground / Demos). The "Connect device" card is visible on Home.
- [ ] Tapping a preset card produces a haptic on a physical device (simulator has no haptic engine; the JS `INVOKE` line still appears in the rspeedy terminal).

## Troubleshooting

| Symptom | Cause / Fix |
|---|---|
| `xcrun simctl install` errors with "no devices booted" | Run `xcrun simctl boot 'iPhone 17 Pro'` first, or open Simulator.app and pick a device. |
| Simulator launches but shows blank Lynx Explorer home screen | `npm run dev` not running, or the bundle URL is wrong. Re-check `rspeedy dev` output for the served `.lynx.bundle` URL. |
| `Snapshot not found` runtime error in LynxExplorer | Conditional JSX or multi-file component imports. See `lynx/AGENTS.md → ReactLynx Critical Rules`. |
| Build fails with `text-transform is not supported` | Lynx CSS limitation — remove the property; capitalize in source instead. |
| `npm install` complains about peer `@lynx-js/react` | The adapter pins `0.116.4`; do not upgrade across minor versions without re-testing against `pluginReactLynx`. |
| Pod install stuck on PrimJS | Normal first time (~20-30 min). Subsequent installs reuse the cache. |
| `com.huxpro.lynx.pulsar` bundle id rejected | You're building the host yourself — change to your own team's id in Xcode project settings. |
| Bundle swap didn't take effect (still seeing Bundle URL card) | The app container path changes on every reinstall. Re-run `APP_BUNDLE=$(xcrun simctl get_app_container booted com.huxpro.lynx.pulsar)` between installs. Also confirm `xcrun simctl terminate` actually killed the previous process before relaunching. |
| Want to load the bundle without swapping (manual path) | Don't swap. Instead seed the pasteboard (`echo "$URL" \| xcrun simctl pbcopy booted`), launch the app, then in the Simulator tap the URL field → long-press → Paste → tap Go. |

## Project topology

```
pulsar/                                  # software-mansion/pulsar (upstream)
├── iOS/                                 # upstream Swift SDK — do not modify
├── Android/                             # upstream Kotlin SDK — do not modify
├── react-native/react-native-pulsar/    # upstream RN adapter — do not modify
├── PulsarApp/                           # upstream Expo app (the port source)
└── lynx/                                # this fork's additions
    ├── lynx-pulsar/                     # Lynx adapter library
    ├── lynx-pulsar-demo/                # SDK harness (ports react-native/PulsarApp/)
    ├── lynx-pulsar-app/                 # ← you are here; ports PulsarApp/
    └── AGENTS.md                        # native-side knowledge base
```

## References

- `lynx/AGENTS.md` — ReactLynx rules, CSS gotchas, LynxExplorer iOS integration
- `lynx/lynx-pulsar-app/AGENTS.md` — source reference, design system, CSS lessons
- `tasks/prd-lynx-adapter.md` — adapter PRD (9 user stories)
- `lynx/lynx-pulsar-app/tasks/prd-demos-hifi.md` — Demos tab port PRD
