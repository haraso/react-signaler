import { ReactNode } from 'react';
import { createComponentNode } from './createComponentNode';
import { addSignal, createSignalCollector } from './createSignalCollector';
import { createValueManager } from './createValueManager';
import { createWeakCollection } from './createWeakCollection';
import { getProtected, ReadonlySignal, setProtected, Signals } from './types';
import { isUntrackEnabled, untrack } from './untrack';

let runningComputed: () => void = null!;
export const getCurrentRunningComputedTrigger = () => runningComputed;

export function computed<Type>(compute: () => Type, watch: Signals[] = []) {
  const versionSetters = createWeakCollection<() => void>();
  const computedTriggers = createWeakCollection<() => void>();
  const computedDirtySetters = createWeakCollection<() => void>();
  const effectTriggers = new Set<() => void>();
  const temporaryEffectTriggers = createWeakCollection<() => void>();
  const { clearValueManager, cloneValue, hasChanges } =
    createValueManager<Type>();

  const { signals, collectSignals, disposeCollect } = createSignalCollector();

  let isDirty = false;
  let currentValue = null as Type;

  const defaultNodeProps: Parameters<typeof createComponentNode>[0] = {
    versionSetters,
    selector: () => currentValue as ReactNode,
  };

  const setDirty = () => {
    isDirty = true;
  };

  const recompute = () => {
    if (!isDirty) return;
    cloneValue(currentValue);
    currentValue = untrack(compute);
    cloneValue(currentValue);
    isDirty = false;
  };

  const update = (isForceRecompute = false) => {
    runningComputed = update;
    temporaryEffectTriggers.clear();
    const oldSignals = new Set(signals.toArray());
    signals.clear();

    cloneValue(currentValue);
    collectSignals(watch);
    currentValue = compute();
    disposeCollect();
    cloneValue(currentValue);
    isDirty = false;

    signals.forEach((s) => {
      oldSignals.delete(s);
      getProtected(s)._addComputed(update);
      computedTriggers.forEach((computedTrigger) => {
        getProtected(s)._addComputed(computedTrigger);
      });

      getProtected(s)._addComputedDirtySetter(setDirty);
      computedDirtySetters.forEach((setter) => {
        getProtected(s)._addComputedDirtySetter(setter);
      });
      if (hasChanges())
        effectTriggers.forEach((effectTrigger) => {
          getProtected(s)._addTemporaryEffect(effectTrigger);
        });
    });

    oldSignals.forEach((s) => {
      getProtected(s)._removeComputed(update);
      computedTriggers.forEach((computedTrigger) => {
        getProtected(s)._removeComputed(computedTrigger);
      });
      getProtected(s)._removeComputedDirtySetter(setDirty);
      computedDirtySetters.forEach((setter) => {
        getProtected(s)._removeComputedDirtySetter(setter);
      });
    });

    if (!hasChanges()) return clearValueManager();

    if (isForceRecompute) {
      computedTriggers.toArray().forEach((trigger) => trigger());
      new Set([
        ...effectTriggers,
        ...temporaryEffectTriggers.toArray(),
      ]).forEach((trigger) => trigger());
      temporaryEffectTriggers.clear();
    }

    versionSetters.toArray().forEach((trigger) => trigger());

    clearValueManager();
    runningComputed = null!;
  };

  const readonlySignal = ((selector?: (value: Type) => ReactNode) => {
    if (!selector) return createComponentNode(defaultNodeProps);
    return createComponentNode({
      versionSetters,
      selector: () => selector(currentValue),
    });
  }) as ReadonlySignal<Type>;

  readonlySignal.get = (getter?: <R = Type>(value: Type) => R) => {
    if (!isUntrackEnabled()) addSignal(readonlySignal);
    recompute();
    if (getter) return getter(currentValue);
    return currentValue;
  };

  readonlySignal.forceRecompute = () => {
    update(true);
  };

  readonlySignal.forceNotifyEffects = () => {
    [...effectTriggers].forEach((trigger) => trigger());
  };

  setProtected(readonlySignal, {
    _addEffect(trigger: () => void) {
      effectTriggers.add(trigger);
    },

    _removeEffect(trigger: () => void) {
      effectTriggers.delete(trigger);
    },

    _addComputed(trigger: () => void) {
      computedTriggers.add(trigger);
      signals.forEach((s) => {
        getProtected(s)._addComputed(trigger);
      });
    },

    _removeComputed(trigger: () => void) {
      computedTriggers.delete(trigger);
      signals.forEach((s) => {
        getProtected(s)._removeComputed(trigger);
      });
    },
    _addComputedDirtySetter(setter: () => void) {
      computedDirtySetters.add(setter);
      signals.forEach((s) => {
        getProtected(s)._addComputedDirtySetter(setter);
      });
    },

    _removeComputedDirtySetter(setter: () => void) {
      computedDirtySetters.delete(setter);
      signals.forEach((s) => {
        getProtected(s)._removeComputedDirtySetter(setter);
      });
    },

    _addTemporaryEffect(trigger: () => void) {
      temporaryEffectTriggers.add(trigger);
      signals.forEach((s) => {
        getProtected(s)._addTemporaryEffect(trigger);
      });
    },

    _creatorFunction: creatorFunction,
  });

  update();

  return readonlySignal;
}

const creatorFunction = computed;
