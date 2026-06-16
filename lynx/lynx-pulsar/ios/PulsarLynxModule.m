#import "PulsarLynxModule.h"
#import "Pulsar-Swift.h"

@implementation PulsarLynxModule {
  Pulsar *pulsar_;
  int nextId_;
  NSMutableDictionary<NSNumber *, PatternComposer *> *patternComposersRegistry_;
}

+ (NSString *)name {
  return @"PulsarModule";
}

+ (NSDictionary<NSString *, NSString *> *)methodLookup {
  return @{
    // Pulsar
    @"play":                          NSStringFromSelector(@selector(play:)),
    @"enableHaptics":                 NSStringFromSelector(@selector(enableHaptics:)),
    @"enableSound":                   NSStringFromSelector(@selector(enableSound:)),
    @"enableCache":                   NSStringFromSelector(@selector(enableCache:)),
    @"clearCache":                    NSStringFromSelector(@selector(clearCache)),
    @"preloadPresets":                NSStringFromSelector(@selector(preloadPresets:)),
    @"stopHaptics":                   NSStringFromSelector(@selector(stopHaptics)),
    @"shutDownEngine":                NSStringFromSelector(@selector(shutDownEngine)),
    @"hapticSupport":                 NSStringFromSelector(@selector(hapticSupport)),
    @"forceHapticsSupportLevel":      NSStringFromSelector(@selector(forceHapticsSupportLevel:)),
    @"enableImpulseCompositionMode":  NSStringFromSelector(@selector(enableImpulseCompositionMode:)),
    @"setRealtimeComposerStrategy":   NSStringFromSelector(@selector(setRealtimeComposerStrategy:)),

    // PatternComposer
    @"parsePattern":                  NSStringFromSelector(@selector(parsePattern:)),
    @"patternPlay":                   NSStringFromSelector(@selector(patternPlay:)),
    @"patternStop":                   NSStringFromSelector(@selector(patternStop:)),
    @"patternRelease":                NSStringFromSelector(@selector(patternRelease:)),

    // RealtimeComposer
    @"realtimeSet":                   NSStringFromSelector(@selector(realtimeSetAmplitude:frequency:)),
    @"realtimePlayDiscrete":          NSStringFromSelector(@selector(realtimePlayDiscreteAmplitude:frequency:)),
    @"realtimeStop":                  NSStringFromSelector(@selector(realtimeStop)),
    @"realtimeIsActive":              NSStringFromSelector(@selector(realtimeIsActive)),
  };
}

- (instancetype)init {
  self = [super init];
  if (self) {
    pulsar_ = [[Pulsar alloc] init];
    nextId_ = 1;
    patternComposersRegistry_ = [NSMutableDictionary new];
  }
  return self;
}

// Pulsar -----------------------------------------------------------------

- (void)play:(NSString *)name {
  [[[pulsar_ getPresets] getByName:name] play];
}

- (void)enableHaptics:(BOOL)state {
  [pulsar_ enableHapticsWithState:state];
}

- (void)enableSound:(BOOL)state {
  [pulsar_ enableSoundWithState:state];
}

- (void)enableCache:(BOOL)state {
  [pulsar_ enableCacheWithState:state];
}

- (void)clearCache {
  [pulsar_ clearCache];
}

- (void)preloadPresets:(NSArray *)presetNames {
  [pulsar_ preloadPresetsWithPresetNames:presetNames];
}

- (void)stopHaptics {
  [pulsar_ stopHaptics];
}

- (void)shutDownEngine {
  [pulsar_ shutDownEngine];
}

- (NSNumber *)hapticSupport {
  return [pulsar_ isHapticsSupported] ? @(4) : @(0);
}

- (void)forceHapticsSupportLevel:(double)level {
  // no-op on iOS
}

- (void)enableImpulseCompositionMode:(BOOL)state {
  // no-op on iOS
}

- (void)setRealtimeComposerStrategy:(double)strategy {
  // no-op on iOS
}

// PatternComposer -----------------------------------------------------------------

- (NSNumber *)parsePattern:(NSDictionary *)data {
  PatternComposer *patternComposer = [pulsar_ getPatternComposer];

  NSDictionary *continuousMap = data[@"continuousPattern"];
  NSArray *discreteArray = data[@"discretePattern"];

  NSMutableArray<ValuePoint *> *amplitudePoints = [NSMutableArray array];
  for (NSDictionary *point in continuousMap[@"amplitude"]) {
    ValuePoint *vp = [[ValuePoint alloc] initWithTime:[point[@"time"] doubleValue]
                                                value:[point[@"value"] floatValue]];
    [amplitudePoints addObject:vp];
  }

  NSMutableArray<ValuePoint *> *frequencyPoints = [NSMutableArray array];
  for (NSDictionary *point in continuousMap[@"frequency"]) {
    ValuePoint *vp = [[ValuePoint alloc] initWithTime:[point[@"time"] doubleValue]
                                                value:[point[@"value"] floatValue]];
    [frequencyPoints addObject:vp];
  }

  ContinuousPattern *continuousPattern =
    [[ContinuousPattern alloc] initWithAmplitude:amplitudePoints
                                       frequency:frequencyPoints];

  NSMutableArray<DiscretePoint *> *discretePoints = [NSMutableArray array];
  for (NSDictionary *point in discreteArray) {
    DiscretePoint *dp = [[DiscretePoint alloc] initWithTime:[point[@"time"] doubleValue]
                                                  amplitude:[point[@"amplitude"] floatValue]
                                                  frequency:[point[@"frequency"] floatValue]];
    [discretePoints addObject:dp];
  }

  PatternData *patternData =
    [[PatternData alloc] initWithContinuousPattern:continuousPattern
                                   discretePattern:discretePoints];
  [patternComposer parsePatternWithHapticsData:patternData];

  int currentId = nextId_;
  nextId_++;
  patternComposersRegistry_[@(currentId)] = patternComposer;
  return @(currentId);
}

- (void)patternPlay:(double)patternId {
  [patternComposersRegistry_[@((int)patternId)] play];
}

- (void)patternStop:(double)patternId {
  [patternComposersRegistry_[@((int)patternId)] stop];
}

- (void)patternRelease:(double)patternId {
  [patternComposersRegistry_ removeObjectForKey:@((int)patternId)];
}

// RealtimeComposer -----------------------------------------------------------------
// no-op on iOS — CoreHaptics realtime API requires different architecture

- (void)realtimeSetAmplitude:(double)amplitude frequency:(double)frequency {
  // no-op on iOS
}

- (void)realtimePlayDiscreteAmplitude:(double)amplitude frequency:(double)frequency {
  // no-op on iOS
}

- (void)realtimeStop {
  // no-op on iOS
}

- (NSNumber *)realtimeIsActive {
  return @(NO);
}

@end
