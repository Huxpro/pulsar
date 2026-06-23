// Background-thread-only access to the native Pulsar module.
//
// Mirrors `lynx-pulsar/src/NativePulsar.ts` but lives in the Vue app so we don't
// drag in the ReactLynx-flavoured hooks (`usePatternComposer` et al. depend on
// `@lynx-js/react`). `Presets` and `Settings` are framework-agnostic, so we
// re-export them from the published adapter unchanged.
// Import the framework-agnostic modules directly rather than the package index,
// which also re-exports the ReactLynx hooks (`usePatternComposer` et al.) and
// would pull `@lynx-js/react` into the Vue bundle. `Presets`, `Settings`,
// `NativePulsar`, and the type/enum files have no React dependency.
import Presets from 'lynx-pulsar/src/Presets'
import Settings from 'lynx-pulsar/src/Settings'
import { HapticSupport, RealtimeComposerStrategy } from 'lynx-pulsar/src/NativePulsar'
import type { Pattern, PatternComposer } from 'lynx-pulsar/src/types'

export { Presets, Settings, HapticSupport, RealtimeComposerStrategy }
export type { Pattern, PatternComposer }

interface PulsarModule {
  parsePattern(data: object): number
  patternPlay(id: number): void
  patternStop(id: number): void
  patternRelease(id: number): void
}

// `NativeModules` is only defined on the background thread in Lynx's dual-thread
// runtime. Event handlers and lifecycle hooks (where we call these) run there.
declare const NativeModules: { PulsarModule: PulsarModule } | undefined

const Pulsar: PulsarModule =
  (typeof NativeModules !== 'undefined' && (NativeModules as { PulsarModule?: PulsarModule })?.PulsarModule) ||
  ({} as PulsarModule)

/**
 * Framework-agnostic replacement for the ReactLynx `usePatternComposer` hook.
 *
 * Vue's `setup()` runs once per component instance, so a plain closure over the
 * parsed pattern id is all we need — no refs, no render-tied effect cleanup.
 * Parse the pattern up front (in `onMounted`) and call `play()` from handlers.
 */
export function createPatternComposer(pattern?: Pattern): PatternComposer {
  let id = -1
  const parse = (p: Pattern) => {
    id = Pulsar.parsePattern(p)
  }
  const play = () => {
    if (id !== -1) Pulsar.patternPlay(id)
  }
  const stop = () => {
    if (id !== -1) Pulsar.patternStop(id)
  }
  const isParsed = () => id !== -1
  if (pattern) parse(pattern)
  return { play, stop, parse, isParsed }
}
