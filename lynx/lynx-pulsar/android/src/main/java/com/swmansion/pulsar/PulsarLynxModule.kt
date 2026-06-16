package com.swmansion.pulsar

import android.content.Context
import com.lynx.jsbridge.LynxModule
import com.lynx.jsbridge.LynxMethod

/**
 * PulsarLynxModule — Lynx Native Module bridge for the Pulsar haptics SDK.
 *
 * Registration (in your Lynx host app):
 *   LynxEnv.inst().registerModule("PulsarModule", PulsarLynxModule::class.java)
 */
class PulsarLynxModule(context: Context) : LynxModule(context) {

    private val pulsar: Pulsar = Pulsar(context)
    private var realtimeComposer = pulsar.getRealtimeComposer()
    private var nextId: Int = 1
    private val patternComposersRegistry: MutableMap<Int, com.swmansion.pulsar.composers.PatternComposer> = mutableMapOf()

    // Pulsar -----------------------------------------------------------------

    @LynxMethod
    fun play(name: String) {
        pulsar.getPresets().getByName(name)?.play()
    }

    @LynxMethod
    fun enableHaptics(state: Boolean) {
        pulsar.enableHaptics(state)
    }

    @LynxMethod
    fun enableSound(state: Boolean) {
        pulsar.enableSound(state)
    }

    @LynxMethod
    fun enableCache(state: Boolean) {
        pulsar.enableCache(state)
    }

    @LynxMethod
    fun clearCache() {
        pulsar.clearCache()
    }

    @LynxMethod
    fun preloadPresets(names: List<String>) {
        pulsar.preloadPresets(names)
    }

    @LynxMethod
    fun stopHaptics() {
        pulsar.stopHaptics()
    }

    @LynxMethod
    fun shutDownEngine() {
        // no-op on Android
    }

    @LynxMethod
    fun hapticSupport(): Double {
        val support = pulsar.hapticSupport()
        return when (support) {
            com.swmansion.pulsar.types.CompatibilityMode.NO_SUPPORT -> 0.0
            com.swmansion.pulsar.types.CompatibilityMode.LIMITED_SUPPORT -> 2.0
            com.swmansion.pulsar.types.CompatibilityMode.STANDARD_SUPPORT -> 3.0
            else -> 4.0
        }
    }

    @LynxMethod
    fun forceHapticsSupportLevel(level: Double) {
        val mode = when (level.toInt()) {
            0 -> com.swmansion.pulsar.types.CompatibilityMode.NO_SUPPORT
            2 -> com.swmansion.pulsar.types.CompatibilityMode.LIMITED_SUPPORT
            3 -> com.swmansion.pulsar.types.CompatibilityMode.STANDARD_SUPPORT
            4 -> com.swmansion.pulsar.types.CompatibilityMode.ADVANCED_SUPPORT
            else -> com.swmansion.pulsar.types.CompatibilityMode.NO_SUPPORT
        }
        pulsar.forceHapticsSupportLevel(mode)
    }

    @LynxMethod
    fun enableImpulseCompositionMode(state: Boolean) {
        pulsar.enableImpulseCompositionMode(state)
    }

    @LynxMethod
    fun setRealtimeComposerStrategy(strategy: Double) {
        val strategyEnum = when (strategy.toInt()) {
            0 -> com.swmansion.pulsar.types.RealtimeComposerStrategy.ENVELOPE
            1 -> com.swmansion.pulsar.types.RealtimeComposerStrategy.PRIMITIVE_TICK
            2 -> com.swmansion.pulsar.types.RealtimeComposerStrategy.PRIMITIVE_COMPLEX
            3 -> com.swmansion.pulsar.types.RealtimeComposerStrategy.ENVELOPE_WITH_DISCRETE_PRIMITIVES
            else -> return
        }
        realtimeComposer = pulsar.getRealtimeComposer(strategyEnum)
    }

    // PatternComposer -----------------------------------------------------------------

    @LynxMethod
    fun parsePattern(data: Map<String, Any>): Int {
        val patternComposer = pulsar.getPatternComposer()

        val continuousMap = data["continuousPattern"] as? Map<String, Any>
        val discreteArray = data["discretePattern"] as? List<Map<String, Any>>

        val amplitudePoints = mutableListOf<com.swmansion.pulsar.types.ValuePoint>()
        (continuousMap?.get("amplitude") as? List<Map<String, Any>>)?.forEach { point ->
            amplitudePoints.add(
                com.swmansion.pulsar.types.ValuePoint(
                    time = (point["time"] as Number).toLong(),
                    value = (point["value"] as Number).toFloat()
                )
            )
        }

        val frequencyPoints = mutableListOf<com.swmansion.pulsar.types.ValuePoint>()
        (continuousMap?.get("frequency") as? List<Map<String, Any>>)?.forEach { point ->
            frequencyPoints.add(
                com.swmansion.pulsar.types.ValuePoint(
                    time = (point["time"] as Number).toLong(),
                    value = (point["value"] as Number).toFloat()
                )
            )
        }

        val continuousPattern = com.swmansion.pulsar.types.ContinuousPattern(
            amplitude = amplitudePoints,
            frequency = frequencyPoints
        )

        val discretePoints = mutableListOf<com.swmansion.pulsar.types.ConfigPoint>()
        discreteArray?.forEach { point ->
            discretePoints.add(
                com.swmansion.pulsar.types.ConfigPoint(
                    time = (point["time"] as Number).toLong(),
                    amplitude = (point["amplitude"] as Number).toFloat(),
                    frequency = (point["frequency"] as Number).toFloat()
                )
            )
        }

        val patternData = com.swmansion.pulsar.types.PatternData(
            continuousPattern = continuousPattern,
            discretePattern = discretePoints
        )
        patternComposer.parsePattern(patternData)

        val currentId = nextId
        nextId++
        patternComposersRegistry[currentId] = patternComposer
        return currentId
    }

    @LynxMethod
    fun patternPlay(patternId: Double) {
        patternComposersRegistry[patternId.toInt()]?.play()
    }

    @LynxMethod
    fun patternStop(patternId: Double) {
        patternComposersRegistry[patternId.toInt()]?.stop()
    }

    @LynxMethod
    fun patternRelease(patternId: Double) {
        patternComposersRegistry.remove(patternId.toInt())
    }

    // RealtimeComposer -----------------------------------------------------------------

    @LynxMethod
    fun realtimeSet(amplitude: Double, frequency: Double) {
        realtimeComposer.set(amplitude.toFloat(), frequency.toFloat())
    }

    @LynxMethod
    fun realtimePlayDiscrete(amplitude: Double, frequency: Double) {
        realtimeComposer.playDiscrete(amplitude.toFloat(), frequency.toFloat())
    }

    @LynxMethod
    fun realtimeStop() {
        realtimeComposer.stop()
    }

    @LynxMethod
    fun realtimeIsActive(): Boolean {
        return realtimeComposer.isActive()
    }
}
