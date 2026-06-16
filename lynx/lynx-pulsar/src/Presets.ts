import Pulsar from './NativePulsar';

export default {
  System: {
    impactLight: () => {
      Pulsar.play('SystemImpactLight');
    },
    impactMedium: () => {
      Pulsar.play('SystemImpactMedium');
    },
    impactHeavy: () => {
      Pulsar.play('SystemImpactHeavy');
    },
    impactSoft: () => {
      Pulsar.play('SystemImpactSoft');
    },
    impactRigid: () => {
      Pulsar.play('SystemImpactRigid');
    },
    notificationSuccess: () => {
      Pulsar.play('SystemNotificationSuccess');
    },
    notificationWarning: () => {
      Pulsar.play('SystemNotificationWarning');
    },
    notificationError: () => {
      Pulsar.play('SystemNotificationError');
    },
    selection: () => {
      Pulsar.play('SystemSelection');
    },

    Android: {
      effectClick: () => {
        Pulsar.play('SystemEffectClick');
      },
      effectDoubleClick: () => {
        Pulsar.play('SystemEffectDoubleClick');
      },
      effectTick: () => {
        Pulsar.play('SystemEffectTick');
      },
      effectHeavyClick: () => {
        Pulsar.play('SystemEffectHeavyClick');
      },

      primitiveClick: () => {
        Pulsar.play('SystemPrimitiveClick');
      },
      primitiveLowTick: () => {
        Pulsar.play('SystemPrimitiveLowTick');
      },
      primitiveQuickFall: () => {
        Pulsar.play('SystemPrimitiveQuickFall');
      },
      primitiveQuickRise: () => {
        Pulsar.play('SystemPrimitiveQuickRise');
      },
      primitiveSlowRise: () => {
        Pulsar.play('SystemPrimitiveSlowRise');
      },
      primitiveSpin: () => {
        Pulsar.play('SystemPrimitiveSpin');
      },
      primitiveThud: () => {
        Pulsar.play('SystemPrimitiveThud');
      },
      primitiveTick: () => {
        Pulsar.play('SystemPrimitiveTick');
      },

      longPress: () => {
        Pulsar.play('SystemLongPress');
      },
      virtualKey: () => {
        Pulsar.play('SystemVirtualKey');
      },
      keyboardTap: () => {
        Pulsar.play('SystemKeyboardTap');
      },
      clockTick: () => {
        Pulsar.play('SystemClockTick');
      },
      calendarDate: () => {
        Pulsar.play('SystemCalendarDate');
      },
      contextClick: () => {
        Pulsar.play('SystemContextClick');
      },
      keyboardPress: () => {
        Pulsar.play('SystemKeyboardPress');
      },
      keyboardRelease: () => {
        Pulsar.play('SystemKeyboardRelease');
      },
      virtualKeyRelease: () => {
        Pulsar.play('SystemVirtualKeyRelease');
      },
      textHandleMove: () => {
        Pulsar.play('SystemTextHandleMove');
      },
      dragCrossing: () => {
        Pulsar.play('SystemDragCrossing');
      },
      gestureStart: () => {
        Pulsar.play('SystemGestureStart');
      },
      gestureEnd: () => {
        Pulsar.play('SystemGestureEnd');
      },
      edgeSqueeze: () => {
        Pulsar.play('SystemEdgeSqueeze');
      },
      edgeRelease: () => {
        Pulsar.play('SystemEdgeRelease');
      },
      confirm: () => {
        Pulsar.play('SystemConfirm');
      },
      release: () => {
        Pulsar.play('SystemRelease');
      },
      scrollTick: () => {
        Pulsar.play('SystemScrollTick');
      },
      scrollItemFocus: () => {
        Pulsar.play('SystemScrollItemFocus');
      },
      scrollLimit: () => {
        Pulsar.play('SystemScrollLimit');
      },
      toggleOn: () => {
        Pulsar.play('SystemToggleOn');
      },
      toggleOff: () => {
        Pulsar.play('SystemToggleOff');
      },
      dragStart: () => {
        Pulsar.play('SystemDragStart');
      },
      segmentTick: () => {
        Pulsar.play('SystemSegmentTick');
      },
      segmentFrequentTick: () => {
        Pulsar.play('SystemSegmentFrequentTick');
      },
    },
  },
// CODEGEN_BEGIN_{getters}
  afterglow: () => {
    Pulsar.play('Afterglow');
  },
  aftershock: () => {
    Pulsar.play('Aftershock');
  },
  alarm: () => {
    Pulsar.play('Alarm');
  },
  anvil: () => {
    Pulsar.play('Anvil');
  },
  applause: () => {
    Pulsar.play('Applause');
  },
  ascent: () => {
    Pulsar.play('Ascent');
  },
  balloonPop: () => {
    Pulsar.play('BalloonPop');
  },
  barrage: () => {
    Pulsar.play('Barrage');
  },
  bassDrop: () => {
    Pulsar.play('BassDrop');
  },
  batter: () => {
    Pulsar.play('Batter');
  },
  bellToll: () => {
    Pulsar.play('BellToll');
  },
  blip: () => {
    Pulsar.play('Blip');
  },
  bloom: () => {
    Pulsar.play('Bloom');
  },
  bongo: () => {
    Pulsar.play('Bongo');
  },
  boulder: () => {
    Pulsar.play('Boulder');
  },
  breakingWave: () => {
    Pulsar.play('BreakingWave');
  },
  breath: () => {
    Pulsar.play('Breath');
  },
  buildup: () => {
    Pulsar.play('Buildup');
  },
  burst: () => {
    Pulsar.play('Burst');
  },
  buzz: () => {
    Pulsar.play('Buzz');
  },
  cadence: () => {
    Pulsar.play('Cadence');
  },
  cameraShutter: () => {
    Pulsar.play('CameraShutter');
  },
  canter: () => {
    Pulsar.play('Canter');
  },
  cascade: () => {
    Pulsar.play('Cascade');
  },
  castanets: () => {
    Pulsar.play('Castanets');
  },
  catPaw: () => {
    Pulsar.play('CatPaw');
  },
  charge: () => {
    Pulsar.play('Charge');
  },
  chime: () => {
    Pulsar.play('Chime');
  },
  chip: () => {
    Pulsar.play('Chip');
  },
  chirp: () => {
    Pulsar.play('Chirp');
  },
  clamor: () => {
    Pulsar.play('Clamor');
  },
  clasp: () => {
    Pulsar.play('Clasp');
  },
  cleave: () => {
    Pulsar.play('Cleave');
  },
  coil: () => {
    Pulsar.play('Coil');
  },
  coinDrop: () => {
    Pulsar.play('CoinDrop');
  },
  combinationLock: () => {
    Pulsar.play('CombinationLock');
  },
  crescendo: () => {
    Pulsar.play('Crescendo');
  },
  dewdrop: () => {
    Pulsar.play('Dewdrop');
  },
  dirge: () => {
    Pulsar.play('Dirge');
  },
  dissolve: () => {
    Pulsar.play('Dissolve');
  },
  dogBark: () => {
    Pulsar.play('DogBark');
  },
  drone: () => {
    Pulsar.play('Drone');
  },
  engineRev: () => {
    Pulsar.play('EngineRev');
  },
  exhale: () => {
    Pulsar.play('Exhale');
  },
  explosion: () => {
    Pulsar.play('Explosion');
  },
  fadeOut: () => {
    Pulsar.play('FadeOut');
  },
  fanfare: () => {
    Pulsar.play('Fanfare');
  },
  feather: () => {
    Pulsar.play('Feather');
  },
  finale: () => {
    Pulsar.play('Finale');
  },
  fingerDrum: () => {
    Pulsar.play('FingerDrum');
  },
  firecracker: () => {
    Pulsar.play('Firecracker');
  },
  fizz: () => {
    Pulsar.play('Fizz');
  },
  flare: () => {
    Pulsar.play('Flare');
  },
  flick: () => {
    Pulsar.play('Flick');
  },
  flinch: () => {
    Pulsar.play('Flinch');
  },
  flourish: () => {
    Pulsar.play('Flourish');
  },
  flurry: () => {
    Pulsar.play('Flurry');
  },
  flush: () => {
    Pulsar.play('Flush');
  },
  gallop: () => {
    Pulsar.play('Gallop');
  },
  gavel: () => {
    Pulsar.play('Gavel');
  },
  glitch: () => {
    Pulsar.play('Glitch');
  },
  guitarStrum: () => {
    Pulsar.play('GuitarStrum');
  },
  hail: () => {
    Pulsar.play('Hail');
  },
  hammer: () => {
    Pulsar.play('Hammer');
  },
  heartbeat: () => {
    Pulsar.play('Heartbeat');
  },
  herald: () => {
    Pulsar.play('Herald');
  },
  hoofBeat: () => {
    Pulsar.play('HoofBeat');
  },
  ignition: () => {
    Pulsar.play('Ignition');
  },
  impact: () => {
    Pulsar.play('Impact');
  },
  jolt: () => {
    Pulsar.play('Jolt');
  },
  keyboardMechanical: () => {
    Pulsar.play('KeyboardMechanical');
  },
  keyboardMembrane: () => {
    Pulsar.play('KeyboardMembrane');
  },
  knell: () => {
    Pulsar.play('Knell');
  },
  knock: () => {
    Pulsar.play('Knock');
  },
  lament: () => {
    Pulsar.play('Lament');
  },
  latch: () => {
    Pulsar.play('Latch');
  },
  lighthouse: () => {
    Pulsar.play('Lighthouse');
  },
  lilt: () => {
    Pulsar.play('Lilt');
  },
  lock: () => {
    Pulsar.play('Lock');
  },
  lope: () => {
    Pulsar.play('Lope');
  },
  march: () => {
    Pulsar.play('March');
  },
  metronome: () => {
    Pulsar.play('Metronome');
  },
  murmur: () => {
    Pulsar.play('Murmur');
  },
  nudge: () => {
    Pulsar.play('Nudge');
  },
  passingCar: () => {
    Pulsar.play('PassingCar');
  },
  patter: () => {
    Pulsar.play('Patter');
  },
  peal: () => {
    Pulsar.play('Peal');
  },
  peck: () => {
    Pulsar.play('Peck');
  },
  pendulum: () => {
    Pulsar.play('Pendulum');
  },
  ping: () => {
    Pulsar.play('Ping');
  },
  pip: () => {
    Pulsar.play('Pip');
  },
  piston: () => {
    Pulsar.play('Piston');
  },
  plink: () => {
    Pulsar.play('Plink');
  },
  plummet: () => {
    Pulsar.play('Plummet');
  },
  plunk: () => {
    Pulsar.play('Plunk');
  },
  poke: () => {
    Pulsar.play('Poke');
  },
  pound: () => {
    Pulsar.play('Pound');
  },
  powerDown: () => {
    Pulsar.play('PowerDown');
  },
  propel: () => {
    Pulsar.play('Propel');
  },
  pulse: () => {
    Pulsar.play('Pulse');
  },
  pummel: () => {
    Pulsar.play('Pummel');
  },
  push: () => {
    Pulsar.play('Push');
  },
  radar: () => {
    Pulsar.play('Radar');
  },
  rain: () => {
    Pulsar.play('Rain');
  },
  ramp: () => {
    Pulsar.play('Ramp');
  },
  rap: () => {
    Pulsar.play('Rap');
  },
  ratchet: () => {
    Pulsar.play('Ratchet');
  },
  rebound: () => {
    Pulsar.play('Rebound');
  },
  ripple: () => {
    Pulsar.play('Ripple');
  },
  rivet: () => {
    Pulsar.play('Rivet');
  },
  rustle: () => {
    Pulsar.play('Rustle');
  },
  shockwave: () => {
    Pulsar.play('Shockwave');
  },
  snap: () => {
    Pulsar.play('Snap');
  },
  sonar: () => {
    Pulsar.play('Sonar');
  },
  spark: () => {
    Pulsar.play('Spark');
  },
  spin: () => {
    Pulsar.play('Spin');
  },
  stagger: () => {
    Pulsar.play('Stagger');
  },
  stamp: () => {
    Pulsar.play('Stamp');
  },
  stampede: () => {
    Pulsar.play('Stampede');
  },
  stomp: () => {
    Pulsar.play('Stomp');
  },
  stoneSkip: () => {
    Pulsar.play('StoneSkip');
  },
  strike: () => {
    Pulsar.play('Strike');
  },
  summon: () => {
    Pulsar.play('Summon');
  },
  surge: () => {
    Pulsar.play('Surge');
  },
  sway: () => {
    Pulsar.play('Sway');
  },
  sweep: () => {
    Pulsar.play('Sweep');
  },
  swell: () => {
    Pulsar.play('Swell');
  },
  syncopate: () => {
    Pulsar.play('Syncopate');
  },
  throb: () => {
    Pulsar.play('Throb');
  },
  thud: () => {
    Pulsar.play('Thud');
  },
  thump: () => {
    Pulsar.play('Thump');
  },
  thunder: () => {
    Pulsar.play('Thunder');
  },
  thunderRoll: () => {
    Pulsar.play('ThunderRoll');
  },
  tickTock: () => {
    Pulsar.play('TickTock');
  },
  tidalSurge: () => {
    Pulsar.play('TidalSurge');
  },
  tideSwell: () => {
    Pulsar.play('TideSwell');
  },
  tremor: () => {
    Pulsar.play('Tremor');
  },
  trigger: () => {
    Pulsar.play('Trigger');
  },
  triumph: () => {
    Pulsar.play('Triumph');
  },
  trumpet: () => {
    Pulsar.play('Trumpet');
  },
  typewriter: () => {
    Pulsar.play('Typewriter');
  },
  unfurl: () => {
    Pulsar.play('Unfurl');
  },
  vortex: () => {
    Pulsar.play('Vortex');
  },
  wane: () => {
    Pulsar.play('Wane');
  },
  warDrum: () => {
    Pulsar.play('WarDrum');
  },
  waterfall: () => {
    Pulsar.play('Waterfall');
  },
  wave: () => {
    Pulsar.play('Wave');
  },
  wisp: () => {
    Pulsar.play('Wisp');
  },
  wobble: () => {
    Pulsar.play('Wobble');
  },
  woodpecker: () => {
    Pulsar.play('Woodpecker');
  },
  zipper: () => {
    Pulsar.play('Zipper');
  },
// CODEGEN_END_{getters}
};
