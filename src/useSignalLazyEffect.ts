import { useCallback, useRef } from 'react';
import { ReadonlySignal } from './computed';
import { Dispose, lazyEffect as createLazyEffect } from './effect';
import { Signal } from './signal';

export function useSignalLazyEffect() {
  const disposesRef = useRef<Record<string, Dispose>>({});
  const lazyEffect = useCallback(
    <T>(
      uniqueEffectKey: string,
      handler: () => T,
      watch: (Signal | ReadonlySignal)[] = [],
    ) => {
      if (disposesRef.current[uniqueEffectKey])
        return disposesRef.current[uniqueEffectKey];

      disposesRef.current[uniqueEffectKey] = createLazyEffect(handler, watch);
      return disposesRef.current[uniqueEffectKey];
    },
    [],
  );

  const dropLazyEffect = useCallback((uniqueEffectKey: string) => {
    if (disposesRef.current[uniqueEffectKey]) {
      disposesRef.current[uniqueEffectKey]?.();
      delete disposesRef.current[uniqueEffectKey];
    }
  }, []);

  const getLazyEffectDispose = useCallback(
    (uniqueEffectKey: string): Dispose | undefined => {
      return disposesRef.current[uniqueEffectKey];
    },
    [],
  );

  return { lazyEffect, dropLazyEffect, getLazyEffectDispose };
}
