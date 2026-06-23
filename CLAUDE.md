# Pulsar — Project Instructions

## Overview

Pulsar is a cross-platform haptics SDK with native implementations for iOS (Swift) and Android (Kotlin), plus framework adapters for React Native and Lynx.

## Repository Layout

- `iOS/` — Swift SDK source
- `Android/` — Kotlin SDK source (not at repo root, referenced by RN/Lynx packages)
- `react-native/react-native-pulsar/` — React Native TurboModule adapter (production, published)
- `PulsarApp/` — **Official demo app** (Expo Router, polished UI — the "real" app to port)
- `react-native/PulsarApp/` — Minimal SDK test harness (originally `react-native/example/`)
- `lynx/lynx-pulsar/` — Lynx Native Module adapter (mirrors RN adapter)
- `lynx/lynx-pulsar-demo/` — Lynx SDK test harness (ports `react-native/PulsarApp/`)
- `lynx/lynx-pulsar-app/` — **Lynx port of the official PulsarApp** (ReactLynx; ports `PulsarApp/`)
- `lynx/lynx-pulsar-vue/` — **Vue Lynx port of the official PulsarApp** (Vue 3; ports `lynx-pulsar-app/` to `vue-lynx`)
- `lynx/AGENTS.md` — **Detailed knowledge base for the Lynx adapter work** (read this for ReactLynx gotchas, build setup, explorer integration)
- `tasks/prd.json` — PRD with 9 user stories (all passing)

## Key References

For Lynx-specific development (ReactLynx patterns, Rspeedy setup, LynxExplorer build):
→ **Read `lynx/AGENTS.md`** — contains all learnings about snapshot errors, CSS limitations, version pinning, and iOS build fixes.

For the official app port (the polished one):
→ **Read `lynx/lynx-pulsar-app/AGENTS.md`** — source reference, design system, port feasibility

For the Vue Lynx port (Vue 3 / `vue-lynx`):
→ **Read `lynx/lynx-pulsar-vue/AGENTS.md`** — ReactLynx→Vue mapping, version pinning (Rsbuild v1), Pulsar bridge

## Development

```bash
# Lynx app (official PulsarApp port — ReactLynx, dev server)
cd lynx/lynx-pulsar-app && npm run dev

# Lynx app (official PulsarApp port — Vue Lynx, dev server)
cd lynx/lynx-pulsar-vue && npm run dev

# Lynx demo (SDK test harness, dev server)
cd lynx/lynx-pulsar-demo && npm run dev

# Typecheck the Lynx adapter
cd lynx/lynx-pulsar && npx tsc --noEmit
```

## Do NOT Modify

- `iOS/` — upstream Swift SDK
- `Android/` — upstream Kotlin SDK
- `react-native/` — published RN adapter
