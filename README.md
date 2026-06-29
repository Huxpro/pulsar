<p align="center">
  <img src="https://raw.githubusercontent.com/software-mansion/pulsar/main/docs/src/assets/og.png" alt="Pulsar - Rich and ready-to use haptics library" />
</p>

<h1 align="center">Lynx Pulsar</h1>

<p align="center">
  A <a href="https://lynxjs.org">Lynx</a> port of <a href="https://github.com/software-mansion/pulsar">Software Mansion's Pulsar</a> haptics SDK and showcase app.
  <br />
  <a href="https://huangxuan.me/pulsar/lynx">Documentation</a>
  ·
  <a href="lynx/lynx-pulsar-app/README.md">Build prompt</a>
  ·
  <a href="https://github.com/software-mansion/pulsar">Upstream Pulsar</a>
</p>

This fork ports the React Native side of Pulsar — adapter, presets, and the polished `PulsarApp` UI — to **[Lynx](https://lynxjs.org)** (ReactLynx + Rspeedy). The iOS / Android / RN sides of the upstream repo are untouched. Everything new lives under [`lynx/`](lynx/).

## What's new in this fork

- **`lynx/lynx-pulsar/`** — Lynx adapter library. Objective-C bridge (`PulsarLynxModule`) to the vendored Pulsar Swift SDK, 151 hand-crafted preset metadata records, `usePatternComposer` / `useRealtimeComposer` hooks. Mirrors `react-native/react-native-pulsar/` but de-worklet-ed for Lynx's threading model.
- **`lynx/lynx-pulsar-app/`** — **Pulsar Showcase**, a Lynx port of upstream [`PulsarApp/`](PulsarApp/). Home / Presets / Playground / Demos. Self-contained `.lynx` bundle (assets inlined as dataURIs) — runs on a customized LynxExplorer host with no dev server.
- **`lynx/lynx-pulsar-demo/`** — **Pulsar Example**, a Lynx port of the RN example app at [`react-native/PulsarApp/`](react-native/PulsarApp/) (originally `react-native/example/`). The minimal SDK-validation surface — one button per story.
- **Build pipeline** — Release-only Xcode build phase auto-runs `rspeedy build` and copies the bundle into the `.app/Resource/`. Same `xcodebuild` archive flow as a native iOS app; `npm` plumbing is hidden.

For the full integration story (one-shot AI build prompt, simulator + device flows, troubleshooting), see [`lynx/lynx-pulsar-app/README.md`](lynx/lynx-pulsar-app/README.md). Architecture and per-tab port notes live in [`lynx/AGENTS.md`](lynx/AGENTS.md) and [`lynx/lynx-pulsar-app/AGENTS.md`](lynx/lynx-pulsar-app/AGENTS.md).

## Quick start

Run the Lynx Pulsar app on the booted iOS Simulator (everything else is documented under each platform's section below).

```bash
git clone https://github.com/Huxpro/pulsar.git
cd pulsar
( cd lynx/lynx-pulsar && npm install )
( cd lynx/lynx-pulsar-app && npm install )

cd ~/github/lynx-pulsar-explorer/explorer/darwin/ios/lynx_explorer
xcodebuild -workspace LynxExplorer.xcworkspace -scheme LynxExplorer \
  -configuration Release \
  -destination "platform=iOS Simulator,name=iPhone 17 Pro" \
  -derivedDataPath build clean build

xcrun simctl install booted build/Build/Products/Release-iphonesimulator/LynxExplorer.app
xcrun simctl launch booted com.huxpro.lynx.pulsar
```

The simulator boots straight into the Presets tab. The first build pays for the Lynx C++ pods (~5-15 min); subsequent archives reuse the cache.

> Setting up the LynxExplorer host the first time (~30 min for the initial `pod install` because of PrimJS) is documented in [`lynx/AGENTS.md → LynxExplorer Integration (iOS)`](lynx/AGENTS.md). After that, every change in `lynx/lynx-pulsar-app/` reaches the device via a plain `xcodebuild -configuration Release archive`.

## Upstream platforms (unchanged)

The other surfaces stay exactly as Software Mansion ships them. For install snippets and full API references, see the upstream sources — this fork intentionally does not restate them.

- **React Native** — [upstream README](https://github.com/software-mansion/pulsar#quick-start) · [`react-native-pulsar` docs](https://docs.swmansion.com/pulsar/sdk/react-native)
- **iOS Swift Package** — [upstream README](https://github.com/software-mansion/pulsar#ios) · [iOS SDK docs](https://docs.swmansion.com/pulsar/sdk/ios)
- **Android Gradle** — [upstream README](https://github.com/software-mansion/pulsar#android) · [Android SDK docs](https://docs.swmansion.com/pulsar/sdk/android)

## Repository structure

```
pulsar/                            # huxpro/pulsar (this fork)
├── iOS/                           # upstream Swift SDK — untouched
├── Android/                       # upstream Kotlin SDK — untouched
├── react-native/                  # upstream RN adapter + example — untouched
├── PulsarApp/                     # upstream Expo showcase — the Lynx port's source
├── lynx/                          # ← everything new
│   ├── lynx-pulsar/               # Lynx adapter library  (published as `lynx-pulsar` on npm)
│   ├── lynx-pulsar-app/           # Pulsar Showcase        (port of PulsarApp/)
│   ├── lynx-pulsar-demo/          # Pulsar Example         (port of react-native/PulsarApp/)
│   └── AGENTS.md                  # ReactLynx rules + LynxExplorer host setup
└── docs/                          # Astro / Starlight docs site (deploys to GitHub Pages)
```

## Packages

| Platform | Package | Source |
|----------|---------|--------|
| **Lynx** | [![npm](https://img.shields.io/npm/v/lynx-pulsar)](https://www.npmjs.com/package/lynx-pulsar) | [`lynx/lynx-pulsar/`](lynx/lynx-pulsar/) |
| React Native | [![npm](https://img.shields.io/npm/v/react-native-pulsar)](https://www.npmjs.com/package/react-native-pulsar) | upstream |
| iOS | [Swift Package](https://github.com/software-mansion-labs/pulsar-ios) | upstream |
| Android | [Maven Central](https://central.sonatype.com/artifact/com.swmansion/pulsar) | upstream |

## Documentation

- **Lynx Pulsar:** [huangxuan.me/pulsar](https://huangxuan.me/pulsar)
- **`lynx-pulsar` on npm:** [npmjs.com/package/lynx-pulsar](https://www.npmjs.com/package/lynx-pulsar)
- **Upstream Pulsar:** [docs.swmansion.com/pulsar](https://docs.swmansion.com/pulsar)

## Contributing

Lynx-side changes land in this fork. iOS / Android / React Native fixes belong upstream — open them at [software-mansion/pulsar](https://github.com/software-mansion/pulsar). General contribution guidelines: [`CONTRIBUTING.md`](CONTRIBUTING.md).

## License

Pulsar is licensed under [The MIT License](LICENSE), as is this fork.

## Credits

Pulsar is created by [Software Mansion](https://swmansion.com); all SDK design decisions, presets, and visual identity belong to the original authors. This Lynx port is an independent fork by [@Huxpro](https://github.com/Huxpro).

The official Pulsar companion app is on the [App Store](https://apps.apple.com/pl/app/haptics-presets-pulsar/id6761362104) and [Google Play](https://play.google.com/store/apps/details?id=com.swmansion.pulsar.app). A Lynx Pulsar TestFlight may follow once host integration stabilizes.
