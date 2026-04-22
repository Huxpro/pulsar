# Lynx Pulsar — Agent Knowledge Base

## Project Structure

```
lynx/
├── lynx-pulsar/          # The Lynx adapter library (npm package)
│   ├── src/              # TypeScript source (NativePulsar, Presets, Settings, etc.)
│   ├── ios/              # PulsarLynxModule.h/.m (ObjC bridge)
│   ├── android/          # PulsarLynxModule.kt (Kotlin bridge)
│   ├── deps/Pulsar/      # Mirrored iOS Swift SDK sources
│   └── test-sync-returns/# Validation test modules
├── lynx-pulsar-demo/     # Rspeedy demo app (SDK test harness, ports react-native/PulsarApp/)
│   ├── src/              # App.tsx, App.css, index.tsx
│   ├── lynx.config.ts    # Rspeedy config with plugins
│   └── PLAN.md           # Port plan for matching RN PulsarApp UI
├── lynx-pulsar-app/      # Rspeedy app (ports the official PulsarApp/ at repo root)
│   ├── src/              # App.tsx, App.css, index.tsx
│   ├── lynx.config.ts    # Rspeedy config with plugins
│   └── AGENTS.md         # Port-specific knowledge base & source reference
└── AGENTS.md             # This file
```

## ReactLynx Critical Rules

### 1. No Conditional JSX Rendering

The dual-thread snapshot system CANNOT handle dynamic structure. This causes `Snapshot not found` runtime errors.

**WRONG:**
```tsx
{condition && <Component />}
{a ? <A /> : <B />}
```

**CORRECT:**
```tsx
<view style={{ display: condition ? "flex" : "none" }}>
  <Component />
</view>
```

### 2. Keep Components in a Single File

Importing sub-components from separate `.tsx` files can cause snapshot errors. The official examples sometimes use separate files for sub-components, but in our case it triggered issues. Safest pattern: define all components in `App.tsx` or use only leaf-level sub-component files that don't have state.

### 3. `.map()` Works — But Beware Context

Official lynx-examples use `.map()` successfully inside `<scroll-view>`. Our earlier snapshot error was caused by the *combination* of multi-file imports + conditional rendering, not by `.map()` alone.

### 4. CSS Limitations in Lynx

- `text-transform` — NOT supported (build error from CSS encoder)
- `box-shadow` shorthand — use carefully, may not work the same
- Use `display: linear` with `linear-orientation: vertical|horizontal` as alternative to flexbox
- `display: flex` works but has quirks
- No CSS Grid (`display: grid` may not work in all versions)

### 5. Event Handling

- Use `bindtap` instead of `onClick`/`onPress`
- Touch events: `bindtouchstart`, `bindtouchmove`, `bindtouchend`
- No gesture-handler library equivalent in Lynx

### 6. Imports

```tsx
import { useState, useEffect, useRef, useCallback } from "@lynx-js/react";
// NOT from "react"
```

### 7. Entry Point Pattern

```tsx
import { root } from "@lynx-js/react";
import { App } from "./App.js";

root.render(<App />);

if (import.meta.webpackHot) {
  import.meta.webpackHot.accept();
}
```

## Rspeedy Project Setup

### Required Dependencies (pinned versions that work together)

```json
{
  "dependencies": {
    "@lynx-js/react": "0.116.4"
  },
  "devDependencies": {
    "@lynx-js/qrcode-rsbuild-plugin": "0.4.6",
    "@lynx-js/react-rsbuild-plugin": "0.12.9",
    "@lynx-js/rspeedy": "0.13.4",
    "@lynx-js/types": "3.7.0"
  }
}
```

**Version alignment is critical** — mismatched `@lynx-js/react` + `@lynx-js/react-rsbuild-plugin` causes "Package subpath not found" errors.

### Config File: `lynx.config.ts`

```ts
import { defineConfig } from "@lynx-js/rspeedy";
import { pluginQRCode } from "@lynx-js/qrcode-rsbuild-plugin";
import { pluginReactLynx } from "@lynx-js/react-rsbuild-plugin";

export default defineConfig({
  plugins: [pluginReactLynx(), pluginQRCode()],
  environments: { web: {}, lynx: {} },
});
```

- File MUST be named `lynx.config.ts` (not `rspeedy.config.ts`)
- `pluginReactLynx()` is required for JSX compilation
- `pluginQRCode()` shows QR code in terminal for LynxExplorer
- `environments: { web: {}, lynx: {} }` enables dual output

### tsconfig.json

```json
{
  "compilerOptions": {
    "jsx": "preserve",
    "jsxImportSource": "@lynx-js/react",
    "module": "node16",
    "moduleResolution": "node16",
    "strict": true,
    "isolatedModules": true,
    "verbatimModuleSyntax": true,
    "esModuleInterop": true,
    "skipLibCheck": true
  },
  "exclude": ["dist/"]
}
```

## LynxExplorer Integration (iOS)

### Worktree Location

`~/github/lynx-pulsar-explorer` (branch: `pulsar-explorer`, from `~/github/lynx` repo)

### What Was Done

1. Copied Pulsar Swift SDK → `LynxExplorer/modules/Pulsar/Sources/Pulsar/`
2. Created `PulsarLynxModule.h/.m` in `LynxExplorer/modules/`
3. Registered in `LynxInitProcessor.m`: `[globalConfig registerModule:PulsarLynxModule.class]`
4. Added all files to Xcode project via `xcodeproj` gem
5. Set `SWIFT_VERSION = 5.0`, `IPHONEOS_DEPLOYMENT_TARGET = 15.0`
6. Set `CFBundleDisplayName = "Lynx P"`, bundle ID `com.huxpro.lynx.pulsar`
7. Signing: team `ZBB74974C5` (Apple Development: huxpro@gmail.com)

### Build Issues & Fixes

| Issue | Fix |
|-------|-----|
| `SWIFT_VERSION '' is unsupported` | Added `SWIFT_VERSION = 5.0` to project build settings |
| `IPHONEOS_DEPLOYMENT_TARGET 10.0` too low for CoreHaptics | Changed to `15.0` |
| `result_of_t` deprecated (Lynx C++ code) | Added `#pragma clang diagnostic ignored "-Wdeprecated-declarations"` in `lynx_actor.h` |
| `-Werror` in Lynx pod causing build failures | `sed -i '' 's/-Werror//g'` on all Pod `project.pbxproj` files |
| `DebugRouter` C++17 errors | Commented out in Podfile (comes back as transitive dep but newer version works) |
| Bundle ID `com.lynx.LynxExplorer` not available | Changed to `com.huxpro.lynx.pulsar` |
| Pod install downloading PrimJS (very slow) | Just wait ~20-30 min. Once cached, subsequent installs are fast. |

### Build Commands

```bash
cd ~/github/lynx-pulsar-explorer/explorer/darwin/ios/lynx_explorer

# Generate podspecs (required first time)
cd ~/github/lynx-pulsar-explorer
python3 tools/ios_tools/generate_podspec_scripts_by_gn.py --root /Users/bytedance/github

# Pod install
cd explorer/darwin/ios/lynx_explorer
COCOAPODS_CONVERT_GIT_TO_HTTP=false LANG=en_US.UTF-8 bundle exec pod install

# Build for simulator
xcodebuild -workspace LynxExplorer.xcworkspace -scheme LynxExplorer \
  -destination 'platform=iOS Simulator,id=EABC0BC7-12FE-4940-969C-FF3D6B9135F5' \
  -derivedDataPath build build

# Build for physical device
xcodebuild -workspace LynxExplorer.xcworkspace -scheme LynxExplorer \
  -destination 'generic/platform=iOS' \
  -derivedDataPath build -allowProvisioningUpdates build

# Install on device
xcrun devicectl device install app --device A39B65CB-6D15-587B-BFE9-FA4B2B1FBDD9 \
  "build/Build/Products/Debug-iphoneos/LynxExplorer.app"
```

### First Launch on Physical Device

After installing, the user must trust the developer certificate:
Settings → General → VPN & Device Management → Trust "Apple Development: huxpro@gmail.com"

## Lynx NativeModule Protocol (iOS)

```objc
@interface PulsarLynxModule : NSObject <LynxModule>
+ (NSString *)name;                    // returns @"PulsarModule"
+ (NSDictionary *)methodLookup;        // maps JS names → ObjC selectors
@end
```

- Registration: `[globalConfig registerModule:PulsarLynxModule.class]`
- Sync return values work (NSNumber, NSString, NSDictionary)
- Pattern data comes as NSDictionary from JS `object` type
- The auto-generated `-Swift.h` bridging header exposes Swift SDK classes to ObjC

## Lynx NativeModule (Android)

```kotlin
class PulsarLynxModule(context: Context) : LynxModule() {
    @LynxMethod
    fun play(name: String) { ... }
}
```

- Registration: `LynxEnv.inst().registerModule("PulsarModule", PulsarLynxModule::class.java)`
- Sync return values work (Int, Double, Boolean, String)
