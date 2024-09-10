import { useCallback, useRef } from 'react';
import { ReadonlySignal } from './computed';
import { Dispose, effect as createEffect } from './effect';
import { Signal } from './signal';

export function useSignalEffect() {
  const disposesRef = useRef<Record<string, Dispose>>({});
  const effect = useCallback(
    <T>(
      uniqueEffectKey: string,
      handler: () => T,
      watch: (Signal | ReadonlySignal)[] = [],
    ) => {
      if (disposesRef.current[uniqueEffectKey])
        return disposesRef.current[uniqueEffectKey];

      disposesRef.current[uniqueEffectKey] = createEffect(handler, watch);
      return disposesRef.current[uniqueEffectKey];
    },
    [],
  );

  const dropEffect = useCallback((uniqueEffectKey: string) => {
    if (disposesRef.current[uniqueEffectKey]) {
      disposesRef.current[uniqueEffectKey]?.();
      delete disposesRef.current[uniqueEffectKey];
    }
  }, []);

  const getEffectDispose = useCallback(
    (uniqueEffectKey: string): Dispose | undefined => {
      return disposesRef.current[uniqueEffectKey];
    },
    [],
  );

  return { effect, dropEffect, getEffectDispose };
}
