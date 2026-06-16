#import "SyncReturnTestModule.h"

@implementation SyncReturnTestModule

+ (NSString *)name {
    return @"SyncReturnTest";
}

+ (NSDictionary<NSString *, NSString *> *)methodLookup {
    return @{
        @"getInt":    NSStringFromSelector(@selector(getInt)),
        @"getDouble": NSStringFromSelector(@selector(getDouble)),
        @"getBool":   NSStringFromSelector(@selector(getBool)),
    };
}

- (NSNumber *)getInt {
    return @(42);
}

- (NSNumber *)getDouble {
    return @(3.14);
}

- (NSNumber *)getBool {
    return @YES;
}

@end
