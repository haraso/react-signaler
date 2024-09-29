import { ReactNode } from 'react';
import { addBatch, isBatching } from './batch';
import { createComponentNode } from './createComponentNode';
import { addSignal } from './createSignalCollector';
import { createValueManager } from './createValueManager';
import { createWeakCollection } from './createWeakCollection';
import { lazyCall } from './lazyCall';
import { loopCheck, tooManyUntrackedUpdateCheck } from './SignalErrors';
import { setProtected, Signal, SignalState } from './types';
import { isUntrackEnabled } from './untrack';

function update<Type>(newValue: Type, state: SignalState<Type>) {
  state.currentValue = newValue;
  state.temporaryEffectTriggers.clear();
  state.computedTriggers.toArray().forEach((trigger) => trigger());
  new Set([
    ...state.effectTriggers,
    ...state.temporaryEffectTriggers.toArray(),
  ]).forEach((trigger) => trigger());
  state.temporaryEffectTriggers.clear();

  state.versionSetters.toArray().forEach((trigger) => trigger());
}

export function signal<Type>(value: Type): Signal<Type> {
  const state: SignalState<Type> = {
    versionSetters: createWeakCollection<() => void>(),
    computedTriggers: createWeakCollection<() => void>(),
    computedDirtySetters: createWeakCollection<() => void>(),
    effectTriggers: new Set<() => void>(),
    temporaryEffectTriggers: createWeakCollection<() => void>(),
    updateCount: 0,
    lastUpdateTimestamp: Date.now(),
    currentValue: value,
  };

  const defaultNodeProps: Parameters<typeof createComponentNode>[0] = {
    state,
    selector: () => state.currentValue as ReactNode,
  };

  const signal = ((
    selector?: ((value: Type) => ReactNode) | string | number,
    key?: string | number,
  ) => {
    if (typeof selector === 'function')
      return createComponentNode({
        state,
        selector: () => selector(state.currentValue),
        key,
      });
    else if (typeof selector !== 'undefined') {
      return createComponentNode(
        {
          ...defaultNodeProps,
          key: selector,
        },
        true,
      );
    }
    return createComponentNode(defaultNodeProps, true);
  }) as Signal<Type>;

  signal.get = (getter?: <R = Type>(value: Type) => R) => {
    if (!isUntrackEnabled()) addSignal(signal);
    if (getter) return getter(state.currentValue);
    return state.currentValue;
  };

  signal.set = (value: Type) => {
    if (!isUntrackEnabled()) addSignal(signal);
    loopCheck(state);
    if (value === state.currentValue) return state.currentValue;
    state.currentValue = value;
    state.computedDirtySetters.toArray().forEach((setter) => setter());
    tooManyUntrackedUpdateCheck(state);

    if (isBatching()) addBatch(state);
    else lazyCall(() => update(value, state));

    return state.currentValue;
  };

  signal.update = (setter: (value: Type) => Type) => {
    if (!isUntrackEnabled()) addSignal(signal);
    loopCheck(state);
    const newValue = setter(state.currentValue);
    if (newValue === state.currentValue) return state.currentValue;
    state.currentValue = newValue;
    state.computedDirtySetters.toArray().forEach((setter) => setter());
    tooManyUntrackedUpdateCheck(state);

    if (isBatching()) addBatch(state);
    else lazyCall(() => update(newValue, state));

    return state.currentValue;
  };

  signal.mutate = (mutator: (value: Type) => void) => {
    const { cloneValue, hasChanges, changes } = createValueManager<Type>();
    if (!isUntrackEnabled()) addSignal(signal);
    loopCheck(state);
    cloneValue(state.currentValue);
    mutator(state.currentValue);
    cloneValue(state.currentValue);
    if (!hasChanges()) return state.currentValue;
    state.computedDirtySetters.toArray().forEach((setter) => setter());
    tooManyUntrackedUpdateCheck(state);

    if (isBatching()) addBatch(state);
    else lazyCall(() => update(changes().at(0)!.newValue, state));

    return state.currentValue;
  };

  signal.forceUpdate = () => {
    update(state.currentValue, state);
  };

  signal.forceNotifyEffects = () => {
    [...state.effectTriggers].forEach((trigger) => trigger());
  };

  setProtected(signal, {
    _addEffect(trigger: () => void) {
      state.effectTriggers.add(trigger);
    },

    _removeEffect(trigger: () => void) {
      state.effectTriggers.delete(trigger);
    },

    _addComputed(trigger: () => void) {
      state.computedTriggers.add(trigger);
    },

    _removeComputed(trigger: () => void) {
      state.computedTriggers.delete(trigger);
    },

    _addTemporaryEffect(trigger: () => void) {
      state.temporaryEffectTriggers.add(trigger);
    },

    _addComputedDirtySetter(setter: () => void) {
      state.computedDirtySetters.add(setter);
    },

    _removeComputedDirtySetter(setter: () => void) {
      state.computedDirtySetters.delete(setter);
    },

    _creatorFunction: creatorFunction,
  });

  return signal;
}

const creatorFunction = signal;
