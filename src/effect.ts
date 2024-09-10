import { ReadonlySignal } from './computed';
import { createSignalCollector } from './createSignalCollector';
import { Signal } from './signal';

export type Dispose = {
  (...signals: (Signal | ReadonlySignal)[]): void;
  forceTrigger: () => void;
};

let runningEffect: () => void = null!;
export const getCurrentRunningEffectTrigger = () => runningEffect;

function createEffect(
  isLazy: boolean,
  handler: () => void,
  watch: (Signal | ReadonlySignal)[] = [],
): Dispose {
  const {
    signals: collectedSignals,
    collectSignals,
    disposeCollect,
  } = createSignalCollector();
  let isRunning = false;

  const trigger = () => {
    runningEffect = trigger;
    const oldSignals = new Set(collectedSignals.toArray());
    collectedSignals.clear();
    collectSignals(watch);
    handler();
    disposeCollect();
    collectedSignals.forEach((s) => {
      s._addEffect(trigger);
      oldSignals.delete(s);
    });
    oldSignals.forEach((s) => s._removeEffect(trigger));
    runningEffect = null!;
  };

  const dispose = (...signals: (Signal | ReadonlySignal)[]) => {
    if (signals.length)
      return signals.forEach((s) => {
        collectedSignals.delete(s);
        s._removeEffect(trigger);
      });

    collectedSignals.forEach((s) => {
      s._removeEffect(trigger);
    });
    collectedSignals.clear();
  };
  dispose.forceTrigger = trigger;

  if (isLazy) {
    watch.forEach((s) => collectedSignals.add(s));
    collectedSignals.forEach((s) => s._addEffect(trigger));
  } else {
    trigger();
  }

  return dispose;
}

export function effect(
  handler: () => void,
  watch?: (Signal | ReadonlySignal)[],
) {
  return createEffect(false, handler, watch);
}

export function lazyEffect(
  handler: () => void,
  watch: (Signal | ReadonlySignal)[],
) {
  return createEffect(true, handler, watch);
}
