import { useCallback } from '@lynx-js/react';
import Pulsar from './NativePulsar';
import type { RealtimeComposerAPI } from './types';

export default function useRealtimeComposer(): RealtimeComposerAPI {
  const set = useCallback((amplitude: number, frequency: number) => {
    Pulsar.realtimeSet(amplitude, frequency);
  }, []);

  const playDiscrete = useCallback((amplitude: number, frequency: number) => {
    Pulsar.realtimePlayDiscrete(amplitude, frequency);
  }, []);

  const stop = useCallback(() => {
    Pulsar.realtimeStop();
  }, []);

  const isActive = useCallback(() => {
    return Pulsar.realtimeIsActive();
  }, []);

  return { set, playDiscrete, stop, isActive };
}
