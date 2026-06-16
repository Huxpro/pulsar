import { useCallback, useEffect, useRef } from '@lynx-js/react';
import Pulsar from './NativePulsar';
import type { Pattern, PatternComposer } from './types';

export default function usePatternComposer(
  pattern?: Pattern
): PatternComposer {
  const patternIdRef = useRef<number>(-1);

  const play = useCallback(() => {
    const id = patternIdRef.current;
    if (id !== -1) {
      Pulsar.patternPlay(id);
    }
  }, []);

  const stop = useCallback(() => {
    const id = patternIdRef.current;
    if (id !== -1) {
      Pulsar.patternStop(id);
    }
  }, []);

  const parse = useCallback((pattern: Pattern) => {
    const newPatternId = Pulsar.parsePattern(pattern);
    patternIdRef.current = newPatternId;
  }, []);

  const isParsed = useCallback(() => {
    return patternIdRef.current !== -1;
  }, []);

  useEffect(() => {
    if (pattern) {
      parse(pattern);
    }

    return () => {
      const id = patternIdRef.current;
      if (id !== -1) {
        Pulsar.patternRelease(id);
      }
    };
  }, [pattern]);

  return { play, stop, parse, isParsed };
}
