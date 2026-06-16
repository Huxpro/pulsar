package com.swmansion.pulsar.test

import com.lynx.tasm.behavior.LynxModule
import com.lynx.tasm.behavior.LynxMethod

/**
 * Minimal test Lynx Native Module to verify synchronous return values.
 *
 * Lynx Native Modules support synchronous return values from @LynxMethod methods.
 * Methods can return Int, Double, Boolean, String, and other primitive types directly.
 *
 * Registration:
 *   LynxEnv.inst().registerModule("SyncReturnTest", SyncReturnTestModule::class.java)
 *
 * JS usage:
 *   const result = NativeModules.SyncReturnTest.getInt();    // returns 42
 *   const flag = NativeModules.SyncReturnTest.getBool();     // returns true
 *   const pi = NativeModules.SyncReturnTest.getDouble();     // returns 3.14
 */
class SyncReturnTestModule : LynxModule() {

    @LynxMethod
    fun getInt(): Int {
        return 42
    }

    @LynxMethod
    fun getDouble(): Double {
        return 3.14
    }

    @LynxMethod
    fun getBool(): Boolean {
        return true
    }
}
