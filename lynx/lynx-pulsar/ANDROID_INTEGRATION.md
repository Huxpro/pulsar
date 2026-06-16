# Android Integration — lynx-pulsar

## LynxExplorer Registration

To use Pulsar haptics in LynxExplorer (or any Lynx Android host app), register the native module during app initialization.

### Step 1: Add the module source

In your host app's `settings.gradle`, include the lynx-pulsar Android module:

```groovy
include ':lynx-pulsar'
project(':lynx-pulsar').projectDir = new File('<path-to-repo>/lynx/lynx-pulsar/android')
```

In your app's `build.gradle`, add the dependency:

```groovy
dependencies {
    implementation project(':lynx-pulsar')
}
```

### Step 2: Register the module

In your Application class or LynxView initialization code, register the module **before** loading any Lynx bundles:

```kotlin
import com.lynx.tasm.LynxEnv
import com.swmansion.pulsar.PulsarLynxModule

// In your Application.onCreate() or before LynxView creation:
LynxEnv.inst().registerModule("PulsarModule", PulsarLynxModule::class.java)
```

### Step 3: Permissions

The library's `AndroidManifest.xml` declares the `VIBRATE` permission. It will be merged into your host app's manifest automatically via Android manifest merger.

### Step 4: Load the bundle

Start the `lynx-pulsar-app` dev server:

```bash
cd lynx/lynx-pulsar-app && npm run dev
```

Then open the dev server URL in LynxExplorer (e.g., `http://<your-ip>:3000/main.lynx.bundle`).

### Verify Module Availability

Use `lynx-devtool` to check if the module is registered:

```bash
node <devtool-path>/scripts/index.mjs cdp -m Runtime.evaluate \
  '{"expression": "typeof NativeModules !== \"undefined\" && NativeModules.PulsarModule != null"}'
```

Expected result: `true`

## Requirements

- Android API 26+ for basic haptic support (Vibrator amplitude control)
- Android API 33+ for primitive haptic support (VibrationEffect.Composition)
- Android API 36+ for advanced envelope support (VibrationEffect.Waveform)
- Physical device required — Android emulator has no haptic motor
