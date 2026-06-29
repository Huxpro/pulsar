# Pulsar — Lynx Port

A ReactLynx port of [Software Mansion's Pulsar](https://github.com/software-mansion/pulsar) haptics app. 151 hand-crafted haptic presets, a pattern composer, and a realtime composer — driven by the native iOS `CoreHaptics` SDK through a Lynx `NativeModule`.

This directory (`lynx/lynx-pulsar-app/`) is the polished demo app. The sibling `lynx/lynx-pulsar/` is the Lynx adapter library it depends on (published on npm as [`lynx-pulsar`](https://www.npmjs.com/package/lynx-pulsar)), mirroring the React Native TurboModule shipped at `react-native/react-native-pulsar/`. Inside this repo the demo uses a workspace `file:../lynx-pulsar` link for fast iteration; external consumers should `npm install lynx-pulsar`.

The runtime host is **Lynx Pulsar** — our customized fork of the upstream `LynxExplorer.app` at `~/github/lynx-pulsar-explorer/`. It carries `PulsarLynxModule` (the native bridge), the Pulsar Swift SDK, the app's display name + icons, and a Release-only Xcode build phase that bakes the rspeedy bundle into `.app/Resource/homepage.lynx.bundle`. Release archives boot straight into Pulsar; Debug archives keep the original Lynx-Explorer "Bundle URL" home card for live reload against `rspeedy dev`.

---

## One-shot build prompt (for an AI agent)

> You are building **Lynx Pulsar.app** — a self-contained iOS app whose JS bundle is compiled in at archive time — and installing it on the user's chosen target (booted iOS Simulator by default, physical iPhone if `--device` is passed). Halt on any error, report progress concisely, and do not modify `iOS/`, `Android/`, or `react-native/` (those are upstream sources).
>
> 1. Install JS deps:
>    ```bash
>    ( cd lynx/lynx-pulsar && npm install --no-audit --no-fund )
>    ( cd lynx/lynx-pulsar-app && npm install --no-audit --no-fund )
>    ```
> 2. Verify the host project exists at `~/github/lynx-pulsar-explorer/explorer/darwin/ios/lynx_explorer/LynxExplorer.xcworkspace`. If missing, follow `lynx/AGENTS.md → LynxExplorer Integration (iOS)` to set it up (one-time, ~30 min for the initial `pod install`).
> 3. Confirm the build phase is present:
>    ```bash
>    grep -q "Bundle Pulsar Lynx code" \
>      ~/github/lynx-pulsar-explorer/explorer/darwin/ios/lynx_explorer/LynxExplorer.xcodeproj/project.pbxproj
>    ```
>    If absent, re-apply it (see `## How the Release path works` below).
> 4. **Simulator path** — Release build for the currently booted simulator:
>    ```bash
>    DEVICE_ID=$(xcrun simctl list devices booted -j | python3 -c 'import sys,json; print(json.load(sys.stdin)["devices"].values().__iter__().__next__()[0]["udid"])')
>    cd ~/github/lynx-pulsar-explorer/explorer/darwin/ios/lynx_explorer
>    xcodebuild -workspace LynxExplorer.xcworkspace -scheme LynxExplorer \
>      -configuration Release \
>      -destination "platform=iOS Simulator,id=$DEVICE_ID" \
>      -derivedDataPath build clean build
>    xcrun simctl install booted build/Build/Products/Release-iphonesimulator/LynxExplorer.app
>    xcrun simctl launch booted com.huxpro.lynx.pulsar
>    sleep 4
>    xcrun simctl io booted screenshot /tmp/pulsar-verify.png
>    sips -Z 900 /tmp/pulsar-verify.png --out /tmp/pulsar-verify-small.png
>    ```
>    Read `/tmp/pulsar-verify-small.png` and confirm the Home tab shows `Welcome to Pulsar!` plus the four-icon tab bar. If you still see a white "Bundle URL" card, the Run Script Build Phase didn't run — re-read step 3.
> 5. **Physical device path** — discover the device UDID, then archive + install:
>    ```bash
>    xcrun devicectl list devices --json-output /tmp/devices.json
>    DEVICE_UDID=$(python3 -c 'import json; ds=json.load(open("/tmp/devices.json"))["result"]["devices"]; print(next(d["identifier"] for d in ds if d["connectionProperties"]["pairingState"]=="paired" and "iPhone" in d["deviceProperties"]["name"]))')
>    cd ~/github/lynx-pulsar-explorer/explorer/darwin/ios/lynx_explorer
>    xcodebuild -workspace LynxExplorer.xcworkspace -scheme LynxExplorer \
>      -configuration Release \
>      -destination "generic/platform=iOS" \
>      -allowProvisioningUpdates \
>      -derivedDataPath build clean build
>    xcrun devicectl device install app --device "$DEVICE_UDID" \
>      build/Build/Products/Release-iphoneos/LynxExplorer.app
>    ```
>    Ask the user to launch "Lynx Pulsar" from their home screen and confirm Home renders. First time on a device requires trusting the cert: *Settings → General → VPN & Device Management → Trust "Apple Development: huxpro@gmail.com"*.

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
- **Lynx Pulsar.app** — the iOS host at `~/github/lynx-pulsar-explorer/` (worktree of `lynx-stack`). Has the Pulsar Swift SDK linked, `PulsarLynxModule` registered, the official PulsarApp's icon copied in, `CFBundleDisplayName = "Lynx Pulsar"`, and a Release-only Xcode build phase that copies our bundle into the app's `Resource/`.

## Prerequisites

- macOS with Xcode 15+ (for the iOS Simulator, `xcrun`, and `devicectl`)
- Node 18+, npm 9+
- A booted iOS Simulator **or** a paired physical iPhone running iOS 15+
- The customized `LynxExplorer.app` host worktree at `~/github/lynx-pulsar-explorer/` with `pod install` completed. One-time setup is in `lynx/AGENTS.md → LynxExplorer Integration (iOS)`.

## How the Release path works

When you `xcodebuild ... -configuration Release` the LynxExplorer workspace, an Xcode Run Script Build Phase named **"Bundle Pulsar Lynx code"** runs after compile, and Xcode's implicit CodeSign runs after that (so the resulting `.app` is correctly signed for the device).

The bundle itself is fully self-contained — `lynx.config.ts` sets `output.dataUriLimit.image = Number.MAX_SAFE_INTEGER`, so all 151 preset PNGs and the tab-bar icons are inlined as dataURIs. The shipped `main.lynx.bundle` is ~6.7 MB and has no runtime HTTP dependencies, which is what makes `local://homepage.lynx.bundle` resolution work on a device with no dev server.

The Run Script logic:

```sh
if [[ "$CONFIGURATION" != *Release* ]]; then exit 0; fi
LYNX_APP_DIR="${LYNX_PULSAR_APP_DIR:-$HOME/github/pulsar/lynx/lynx-pulsar-app}"
cd "$LYNX_APP_DIR" && npm run build
cp "$LYNX_APP_DIR/dist/main.lynx.bundle" "$BUILT_PRODUCTS_DIR/$UNLOCALIZED_RESOURCES_FOLDER_PATH/homepage.lynx.bundle"
```

It is gated on `CONFIGURATION` so Debug builds skip it. The destination — `homepage.lynx.bundle` inside the `.app`'s `Resource/` — is the file `LynxExplorer`'s `AppDelegate.mm` loads on launch (`file://lynx?local://homepage.lynx.bundle?fullscreen=true`). Net effect: Release archive boots straight into Pulsar without a dev server.

To (re-)install the phase from a checkout that doesn't yet have it (e.g. you just refreshed the LynxExplorer worktree from upstream), run:

```bash
/opt/homebrew/opt/ruby/bin/ruby <<'RB'
require 'xcodeproj'
PROJECT = File.expand_path("~/github/lynx-pulsar-explorer/explorer/darwin/ios/lynx_explorer/LynxExplorer.xcodeproj")
NAME = "Bundle Pulsar Lynx code"
SCRIPT = <<~SH
  set -euo pipefail
  if [[ "$CONFIGURATION" != *Release* ]]; then echo "Pulsar Lynx: skip Debug"; exit 0; fi
  LYNX_APP_DIR="${LYNX_PULSAR_APP_DIR:-$HOME/github/pulsar/lynx/lynx-pulsar-app}"
  cd "$LYNX_APP_DIR"
  if [ ! -d node_modules ]; then ( cd ../lynx-pulsar && npm install --no-audit --no-fund ); npm install --no-audit --no-fund; fi
  PATH="/opt/homebrew/bin:/usr/local/bin:$PATH" npm run build
  cp "$LYNX_APP_DIR/dist/main.lynx.bundle" "$BUILT_PRODUCTS_DIR/$UNLOCALIZED_RESOURCES_FOLDER_PATH/homepage.lynx.bundle"
SH
project = Xcodeproj::Project.open(PROJECT)
target = project.targets.find { |t| t.name == "LynxExplorer" }
phase = target.build_phases.find { |p| p.respond_to?(:name) && p.name == NAME } ||
        target.new_shell_script_build_phase(NAME)
phase.shell_path = "/bin/bash"
phase.shell_script = SCRIPT
phase.always_out_of_date = "1"
project.save
RB
```

## How the Debug path works

A `Debug`-configured `LynxExplorer.app` skips the bundle bake. On launch it shows the standard "Bundle URL" home card; this is where you paste a `rspeedy dev` URL for hot reload:

```bash
( cd lynx/lynx-pulsar-app && npm run dev ) &
# rspeedy prints: ➜  Lynx http://<host>:<port>/main.lynx.bundle
echo "http://127.0.0.1:<port>/main.lynx.bundle?fullscreen=true" | xcrun simctl pbcopy booted
xcrun simctl launch booted com.huxpro.lynx.pulsar
# In the Simulator: tap the URL field → long-press → Paste → tap Go.
```

## Verification checklist

- [ ] `~/github/lynx-pulsar-explorer/.../LynxExplorer.xcodeproj/project.pbxproj` contains `"Bundle Pulsar Lynx code"`.
- [ ] `dist/main.lynx.bundle` exists after `npm run build` (Release) or `npm run dev` (Debug).
- [ ] The installed app shows `Lynx Pulsar` under the official Pulsar app icon on the home screen.
- [ ] Launching the Release-installed app goes straight to `Welcome to Pulsar!` + four-icon tab bar — no Bundle-URL card.
- [ ] Tapping a preset card produces a haptic on a physical device (the simulator has no haptic engine; the JS `INVOKE` line still shows in the rspeedy terminal in Debug).

## Troubleshooting

| Symptom | Cause / Fix |
|---|---|
| Release build runs forever on first try | The Run Script does a clean `npm install` for both `lynx-pulsar` and `lynx-pulsar-app` plus a `rspeedy build`. Subsequent builds reuse `node_modules`. |
| Run Script aborts with "LYNX_APP_DIR not found" | The Lynx app source must live at `~/github/pulsar/lynx/lynx-pulsar-app`. Either symlink there, or override by adding `LYNX_PULSAR_APP_DIR = <abs-path>` to your Xcode user xcconfig. |
| `npm: command not found` during the build phase | Xcode runs scripts with a stripped PATH. The phase prepends `/opt/homebrew/bin:/usr/local/bin`; if your `npm` lives elsewhere, edit the phase script. |
| Debug install still shows old "Lynx Explorer" name / icon | The simulator caches the previous bundle. `xcrun simctl uninstall booted com.huxpro.lynx.pulsar` then reinstall. |
| Physical device install fails with provisioning error | Make sure your Apple ID is added to Xcode > Settings > Accounts, and your iPhone is paired and unlocked. `-allowProvisioningUpdates` will create a free dev cert for `com.huxpro.lynx.pulsar` automatically. |
| First launch on device shows "Untrusted Developer" | Settings → General → VPN & Device Management → Trust the cert. |
| Pod install stuck on PrimJS | Normal first time (~20-30 min). Subsequent installs reuse the cache. |
| Build fails with `text-transform is not supported` | Lynx CSS limitation — remove the property; capitalize in source instead. |
| `npm install` complains about peer `@lynx-js/react` | The adapter pins `0.116.4`; do not upgrade across minor versions without re-testing against `pluginReactLynx`. |

## Project topology

```
pulsar/                                  # software-mansion/pulsar (this fork: huxpro/pulsar)
├── iOS/                                 # upstream Swift SDK — do not modify
├── Android/                             # upstream Kotlin SDK — do not modify
├── react-native/react-native-pulsar/    # upstream RN adapter — do not modify
├── PulsarApp/                           # upstream Expo app (the port source for App.tsx + icons)
└── lynx/                                # this fork's additions
    ├── lynx-pulsar/                     # Lynx adapter library
    ├── lynx-pulsar-demo/                # Pulsar Example (ports react-native/PulsarApp/)
    ├── lynx-pulsar-app/                 # ← you are here; ports PulsarApp/
    └── AGENTS.md                        # native-side knowledge base

~/github/lynx-pulsar-explorer/           # LynxExplorer worktree (lynx-stack), NOT in this repo
└── explorer/darwin/ios/lynx_explorer/
    ├── LynxExplorer.xcodeproj           # ← contains "Bundle Pulsar Lynx code" phase
    ├── LynxExplorer/
    │   ├── Info.plist                   # CFBundleDisplayName = "Lynx Pulsar"
    │   ├── Assets.xcassets/AppIcon.../  # Pulsar 1024 PNG → all sizes via sips
    │   └── modules/
    │       ├── Pulsar/Sources/Pulsar/   # mirrored Pulsar Swift SDK
    │       └── PulsarLynxModule.{h,m}   # NativeModule bridge
    └── ...
```

## References

- `lynx/AGENTS.md` — ReactLynx rules, CSS gotchas, LynxExplorer iOS integration (initial pod install, signing)
- `lynx/lynx-pulsar-app/AGENTS.md` — source reference, design system, CSS lessons
- `tasks/prd-lynx-adapter.md` — adapter PRD (9 user stories)
- `lynx/lynx-pulsar-app/tasks/prd-demos-hifi.md` — Demos tab port PRD
- `~/github/lynx-dev-clients-pulsar/PLAN.md` — long-term plan for generalizing the Run Script + provider story into a `LynxDevClient` package
