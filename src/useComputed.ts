import { useCallback, useRef } from 'react';
import { computed as createComputed } from './computed';
import { ReadonlySignal, Signals } from './types';

export function useComputed() {
  const signalsRef = useRef<Record<string, ReadonlySignal>>({});
  const computed = useCallback(
    <T>(uniqueComputedKey: string, compute: () => T, watch: Signals[] = []) => {
      if (signalsRef.current[uniqueComputedKey])
        return signalsRef.current[uniqueComputedKey];

      signalsRef.current[uniqueComputedKey] = createComputed(compute, watch);
      return signalsRef.current[uniqueComputedKey];
    },
    [],
  );

  const dropComputed = useCallback((uniqueComputedKey: string) => {
    if (signalsRef.current[uniqueComputedKey])
      delete signalsRef.current[uniqueComputedKey];
  }, []);

  const getComputed = useCallback(
    (uniqueComputedKey: string): ReadonlySignal | undefined => {
      return signalsRef.current[uniqueComputedKey];
    },
    [],
  );

  return { computed, dropComputed, getComputed };
}
