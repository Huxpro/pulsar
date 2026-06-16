# Synchronous Return Values in Lynx Native Modules

## Summary

Lynx Native Modules **do support synchronous return values** for primitive types
(number, boolean, string). This is confirmed by Lynx's `LynxModule` architecture
which dispatches method calls synchronously on the JS thread and marshals return
values back to the caller.

## Verification Steps

### Android
1. Register the test module: `LynxEnv.inst().registerModule("SyncReturnTest", SyncReturnTestModule::class.java)`
2. In JS, call: `const result = NativeModules.SyncReturnTest.getInt()`
3. Verify `result === 42`
4. Repeat for `getDouble()` (expect 3.14) and `getBool()` (expect true)

### iOS
1. Register the test module: `[globalConfig registerModule:SyncReturnTestModule.class]`
2. In JS, call: `const result = NativeModules.SyncReturnTest.getInt()`
3. Verify `result === 42`
4. Repeat for `getDouble()` (expect 3.14) and `getBool()` (expect 1/true)

## Impact on Pulsar API

Since synchronous returns work, `hapticSupport()` returns `number` directly and
`parsePattern(data)` returns `number` (patternId) directly. No callback-based
fallback design is needed.

## Fallback Design (if sync returns were NOT supported)

For reference, the callback-based fallback would be:
- `parsePattern(data: object, callback: (patternId: number) => void): void`
- `hapticSupport(callback: (level: number) => void): void`

This fallback is NOT needed — the synchronous API is used.
