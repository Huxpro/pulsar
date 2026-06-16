/**
 * Minimal test Lynx Native Module to verify synchronous return values on iOS.
 *
 * Lynx Native Modules on iOS support synchronous return values via +methodLookup.
 * Methods returning NSNumber*, NSString*, NSDictionary*, etc. are delivered
 * synchronously to the JS caller.
 *
 * Registration:
 *   [globalConfig registerModule:SyncReturnTestModule.class];
 *
 * JS usage:
 *   const result = NativeModules.SyncReturnTest.getInt();    // returns 42
 *   const flag = NativeModules.SyncReturnTest.getBool();     // returns 1
 *   const pi = NativeModules.SyncReturnTest.getDouble();     // returns 3.14
 */

#import <Lynx/LynxModule.h>

@interface SyncReturnTestModule : NSObject <LynxModule>

@end
