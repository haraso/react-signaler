import { useCallback, useRef } from 'react';
import { signal as createSignal } from './signal';
import { Signal } from './types';

export function useSignal() {
  const signalsRef = useRef<Record<string, Signal>>({});
  const signal = useCallback(
    <T>(uniqueSignalKey: string, valueFactory: () => T) => {
      if (signalsRef.current[uniqueSignalKey])
        return signalsRef.current[uniqueSignalKey];

      signalsRef.current[uniqueSignalKey] = createSignal(valueFactory());
      return signalsRef.current[uniqueSignalKey];
    },
    [],
  );

  const dropSignal = useCallback((uniqueSignalKey: string) => {
    if (signalsRef.current[uniqueSignalKey])
      delete signalsRef.current[uniqueSignalKey];
  }, []);

  const getSignal = useCallback(
    (uniqueSignalKey: string): Signal | undefined => {
      return signalsRef.current[uniqueSignalKey];
    },
    [],
  );

  return { signal, dropSignal, getSignal };
}
