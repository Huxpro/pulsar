# lynx-pulsar

Pulsar haptics for [Lynx](https://lynxjs.org) / ReactLynx. Companion to [`react-native-pulsar`](https://www.npmjs.com/package/react-native-pulsar), exposing the same Pulsar engine (system feedback, built-in presets, custom patterns, real-time composition) as a Lynx Native Module.

> Status: early preview (`0.1.0`). API surface matches `react-native-pulsar` but is not yet pinned.

## Install

```sh
npm install lynx-pulsar
# or
pnpm add lynx-pulsar
```

Peer dependency: `@lynx-js/react >= 0.118`.

This package ships native sources (Swift / Kotlin) under `ios/` and `android/`. They need to be wired into your Lynx host app's native build — see the iOS and Android integration notes in the [repo](https://github.com/Huxpro/pulsar/tree/main/lynx/lynx-pulsar).

## Usage

```tsx
import { Presets, Settings, usePatternComposer, useRealtimeComposer } from 'lynx-pulsar';

// 1. System feedback
Presets.System.impactMedium();
Presets.System.notificationSuccess();

// 2. Built-in expressive presets
Presets.heartbeat();
Presets.dogBark();

// 3. Check support
const support = Settings.getHapticsSupportLevel();
```

For pattern composition and real-time control, see `usePatternComposer` / `useRealtimeComposer` in [`src/`](https://github.com/Huxpro/pulsar/tree/main/lynx/lynx-pulsar/src).

## License

MIT
