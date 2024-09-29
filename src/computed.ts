import { ReactNode } from 'react';
import { createComponentNode } from './createComponentNode';
import { addSignal, createSignalCollector } from './createSignalCollector';
import { createValueManager } from './createValueManager';
import { createWeakCollection } from './createWeakCollection';
import {
  getProtected,
  ReadonlySignal,
  ReadonlySignalState,
  setProtected,
  Signals,
} from './types';
import { isUntrackEnabled, untrack } from './untrack';

let runningComputed: () => void = null!;
export const getCurrentRunningComputedTrigger = () => runningComputed;

export function computed<Type>(
  compute: () => Type,
  watch: Signals[] = [],
): ReadonlySignal<Type> {
  const state: ReadonlySignalState<Type> = {
    versionSetters: createWeakCollection<() => void>(),
    computedTriggers: createWeakCollection<() => void>(),
    computedDirtySetters: createWeakCollection<() => void>(),
    effectTriggers: new Set<() => void>(),
    temporaryEffectTriggers: createWeakCollection<() => void>(),
    currentValue: null as Type,
    isDirty: false,
  };

  const { clearValueManager, cloneValue, hasChanges } =
    createValueManager<Type>();

  const { signals, collectSignals, disposeCollect } = createSignalCollector();

  const defaultNodeProps: Parameters<typeof createComponentNode>[0] = {
    state,
    selector: () => state.currentValue as ReactNode,
  };

  const setDirty = () => {
    state.isDirty = true;
  };

  const recompute = () => {
    if (!state.isDirty) return;
    cloneValue(state.currentValue);
    state.currentValue = untrack(compute);
    cloneValue(state.currentValue);
    state.isDirty = false;
  };

  const update = (isForceRecompute = false) => {
    runningComputed = update;
    state.temporaryEffectTriggers.clear();
    const oldSignals = new Set(signals.toArray());
    signals.clear();

    cloneValue(state.currentValue);
    collectSignals(watch);
    state.currentValue = compute();
    disposeCollect();
    cloneValue(state.currentValue);
    state.isDirty = false;

    signals.forEach((s) => {
      oldSignals.delete(s);
      getProtected(s)._addComputed(update);
      state.computedTriggers.forEach((computedTrigger) => {
        getProtected(s)._addComputed(computedTrigger);
      });

      getProtected(s)._addComputedDirtySetter(setDirty);
      state.computedDirtySetters.forEach((setter) => {
        getProtected(s)._addComputedDirtySetter(setter);
      });
      if (hasChanges())
        state.effectTriggers.forEach((effectTrigger) => {
          getProtected(s)._addTemporaryEffect(effectTrigger);
        });
    });

    oldSignals.forEach((s) => {
      getProtected(s)._removeComputed(update);
      state.computedTriggers.forEach((computedTrigger) => {
        getProtected(s)._removeComputed(computedTrigger);
      });
      getProtected(s)._removeComputedDirtySetter(setDirty);
      state.computedDirtySetters.forEach((setter) => {
        getProtected(s)._removeComputedDirtySetter(setter);
      });
    });

    if (!hasChanges()) {
      runningComputed = null!;
      return clearValueManager();
    }

    if (isForceRecompute) {
      state.computedTriggers.toArray().forEach((trigger) => trigger());
      new Set([
        ...state.effectTriggers,
        ...state.temporaryEffectTriggers.toArray(),
      ]).forEach((trigger) => trigger());
      state.temporaryEffectTriggers.clear();
    }

    state.versionSetters.toArray().forEach((trigger) => trigger());

    clearValueManager();
    runningComputed = null!;
  };

  const readonlySignal = ((
    selector?: ((value: Type) => ReactNode) | string | number,
    key?: string | number,
  ) => {
    if (typeof selector === 'function')
      return createComponentNode({
        state,
        selector: () => selector(state.currentValue),
        key,
      });
    else if (typeof selector !== 'undefined')
      return createComponentNode(
        {
          ...defaultNodeProps,
          key: selector,
        },
        true,
      );
    return createComponentNode(defaultNodeProps, true);
  }) as ReadonlySignal<Type>;

  readonlySignal.get = (getter?: <R = Type>(value: Type) => R) => {
    if (!isUntrackEnabled()) addSignal(readonlySignal);
    recompute();
    if (getter) return getter(state.currentValue);
    return state.currentValue;
  };

  readonlySignal.forceRecompute = () => {
    update(true);
  };

  readonlySignal.forceNotifyEffects = () => {
    [...state.effectTriggers].forEach((trigger) => trigger());
  };

  setProtected(readonlySignal, {
    _addEffect(trigger: () => void) {
      state.effectTriggers.add(trigger);
    },

    _removeEffect(trigger: () => void) {
      state.effectTriggers.delete(trigger);
    },

    _addComputed(trigger: () => void) {
      state.computedTriggers.add(trigger);
      signals.forEach((s) => {
        getProtected(s)._addComputed(trigger);
      });
    },

    _removeComputed(trigger: () => void) {
      state.computedTriggers.delete(trigger);
      signals.forEach((s) => {
        getProtected(s)._removeComputed(trigger);
      });
    },
    _addComputedDirtySetter(setter: () => void) {
      state.computedDirtySetters.add(setter);
      signals.forEach((s) => {
        getProtected(s)._addComputedDirtySetter(setter);
      });
    },

    _removeComputedDirtySetter(setter: () => void) {
      state.computedDirtySetters.delete(setter);
      signals.forEach((s) => {
        getProtected(s)._removeComputedDirtySetter(setter);
      });
    },

    _addTemporaryEffect(trigger: () => void) {
      state.temporaryEffectTriggers.add(trigger);
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
