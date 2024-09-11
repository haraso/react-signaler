import { useCallback, useEffect, useRef } from 'react';
import { Dispose, effect as createEffect } from './effect';
import { Signals } from './types';

export function useSignalEffect() {
  const disposesRef = useRef<Record<string, Dispose>>({});
  const effect = useCallback(
    <T>(uniqueEffectKey: string, handler: () => T, watch: Signals[] = []) => {
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

  useEffect(
    () => () =>
      Object.values(disposesRef.current).forEach((dispose) => dispose()),
    [],
  );

  return { effect, dropEffect, getEffectDispose };
}
