import { defineConfig } from '@lynx-js/rspeedy'

import { pluginQRCode } from '@lynx-js/qrcode-rsbuild-plugin'
import { pluginVueLynx } from 'vue-lynx/plugin'

export default defineConfig({
  environments: {
    lynx: {},
    web: {},
  },
  plugins: [
    pluginQRCode({
      schema(url) {
        // `?fullscreen=true` opens the page in LynxExplorer in full screen mode.
        return `${url}?fullscreen=true`
      },
    }),
    pluginVueLynx({
      // Use the Composition API only (matches `<script setup>` throughout).
      optionsApi: false,
      enableCSSInlineVariables: true,
      enableCSSInheritance: true,
    }),
  ],
  output: {
    // Inline ALL assets as dataURIs so the .lynx bundle is self-contained when
    // loaded via file://lynx?local://... in the Lynx Pulsar host. The dev server
    // path still works fine; only the load mechanism changes. (Mirrors the
    // ReactLynx lynx-pulsar-app config.)
    dataUriLimit: { image: Number.MAX_SAFE_INTEGER },
  },
})
