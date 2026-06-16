# Keep the Lynx native module bridge class and all @LynxMethod-annotated methods
-keep class com.swmansion.pulsar.PulsarLynxModule {
    @com.lynx.jsbridge.LynxMethod *;
}

# Keep the Pulsar SDK classes used by the bridge
-keep class com.swmansion.pulsar.Pulsar { *; }
-keep class com.swmansion.pulsar.types.** { *; }
-keep class com.swmansion.pulsar.composers.** { *; }
-keep class com.swmansion.pulsar.presets.** { *; }
-keep class com.swmansion.pulsar.haptics.** { *; }
-keep class com.swmansion.pulsar.audio.** { *; }
