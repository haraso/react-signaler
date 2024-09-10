import { ReactNode } from 'react';
import { createComponentNode } from './createComponentNode';
import { addSignal, createSignalCollector } from './createSignalCollector';
import { createValueManager } from './createValueManager';
import { createWeakCollection } from './createWeakCollection';
import { Signal } from './signal';
import { isUntrackEnabled, untrack } from './untrack';

export type ReadonlySignal<Type = any> = {
  (compute?: (value: Type) => ReactNode): ReactNode;
  get(): Type;
  get(select: <R = Type>(value: Type) => R): Type;
  forceRecompute(): void;
  forceNotifyEffects(): void;
  _addEffect(trigger: () => void): void;
  _removeEffect(trigger: () => void): void;
  _addComputed(trigger: () => void): void;
  _removeComputed(trigger: () => void): void;
  _addTemporaryEffect(trigger: () => void): void;
  _addComputedDirtySetter(setter: () => void): void;
  _removeComputedDirtySetter(setter: () => void): void;
  _creatorFunction: (
    compute: () => Type,
    watch?: Signal[],
  ) => ReadonlySignal<Type>;
};

let runningComputed: () => void = null!;
export const getCurrentRunningComputedTrigger = () => runningComputed;

export function computed<Type>(
  compute: () => Type,
  watch: (Signal | ReadonlySignal)[] = [],
) {
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

    //update
    cloneValue(currentValue);
    collectSignals(watch);
    currentValue = compute();
    disposeCollect();
    cloneValue(currentValue);
    isDirty = false;

    //add for next update
    signals.forEach((s) => {
      oldSignals.delete(s);
      s._addComputed(update);
      computedTriggers.forEach((computedTrigger) => {
        s._addComputed(computedTrigger);
      });

      s._addComputedDirtySetter(setDirty);
      computedDirtySetters.forEach((setter) => {
        s._addComputedDirtySetter(setter);
      });
      if (hasChanges())
        effectTriggers.forEach((effectTrigger) => {
          s._addTemporaryEffect(effectTrigger);
        });
    });

    oldSignals.forEach((s) => {
      s._removeComputed(update);
      computedTriggers.forEach((computedTrigger) => {
        s._removeComputed(computedTrigger);
      });
      s._removeComputedDirtySetter(setDirty);
      computedDirtySetters.forEach((setter) => {
        s._removeComputedDirtySetter(setter);
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
    if (!selector)
      return createComponentNode({
        versionSetters,
        selector: () => currentValue as ReactNode,
      });

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

  readonlySignal._addEffect = (trigger: () => void) => {
    effectTriggers.add(trigger);
  };

  readonlySignal._removeEffect = (trigger: () => void) => {
    effectTriggers.delete(trigger);
  };

  readonlySignal._addComputed = (trigger: () => void) => {
    computedTriggers.add(trigger);
    signals.forEach((s) => {
      s._addComputed(trigger);
    });
  };

  readonlySignal._removeComputed = (trigger: () => void) => {
    computedTriggers.delete(trigger);
    signals.forEach((s) => {
      s._removeComputed(trigger);
    });
  };
  readonlySignal._addComputedDirtySetter = (setter: () => void) => {
    computedDirtySetters.add(setter);
    signals.forEach((s) => {
      s._addComputedDirtySetter(setter);
    });
  };

  readonlySignal._removeComputedDirtySetter = (setter: () => void) => {
    computedDirtySetters.delete(setter);
    signals.forEach((s) => {
      s._removeComputedDirtySetter(setter);
    });
  };

  readonlySignal._addTemporaryEffect = (trigger: () => void) => {
    temporaryEffectTriggers.add(trigger);
    signals.forEach((s) => {
      s._addTemporaryEffect(trigger);
    });
  };

  readonlySignal._creatorFunction = creatorFunction;

  update();

  return readonlySignal;
}

const creatorFunction = computed;
