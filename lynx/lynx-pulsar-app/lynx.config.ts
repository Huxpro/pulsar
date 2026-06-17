import { defineConfig } from "@lynx-js/rspeedy";
import { pluginQRCode } from "@lynx-js/qrcode-rsbuild-plugin";
import { pluginReactLynx } from "@lynx-js/react-rsbuild-plugin";

export default defineConfig({
  plugins: [pluginReactLynx(), pluginQRCode()],
  environments: { web: {}, lynx: {} },
  output: {
    // Inline ALL assets as dataURIs so the .lynx bundle is self-contained when
    // loaded via file://lynx?local://... in the Lynx Pulsar host. The dev server
    // path still works fine; only the load mechanism changes.
    dataUriLimit: { image: Number.MAX_SAFE_INTEGER },
  },
});
