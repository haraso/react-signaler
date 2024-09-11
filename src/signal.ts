import { ReactNode } from 'react';
import { addBatch, isBatching } from './batch';
import { getCurrentRunningComputedTrigger } from './computed';
import { createComponentNode } from './createComponentNode';
import { addSignal } from './createSignalCollector';
import { createValueManager } from './createValueManager';
import { createWeakCollection } from './createWeakCollection';
import { getCurrentRunningEffectTrigger } from './effect';
import { lazyCall } from './lazyCall';
import { LoopError, TooManyUntrackUpdatesError } from './SignalErrors';
import { setProtected, Signal } from './types';
import { isUntrackEnabled } from './untrack';

export function signal<Type>(value: Type) {
  const versionSetters = createWeakCollection<() => void>();
  const computedTriggers = createWeakCollection<() => void>();
  const computedDirtySetters = createWeakCollection<() => void>();
  const effectTriggers = new Set<() => void>();
  const temporaryEffectTriggers = createWeakCollection<() => void>();
  let updateCount = 0;
  let lastUpdateTimestamp = Date.now();

  let currentValue = value;

  const defaultNodeProps: Parameters<typeof createComponentNode>[0] = {
    versionSetters,
    selector: () => currentValue as ReactNode,
  };

  const signal = ((selector?: (value: Type) => ReactNode) => {
    if (!selector) return createComponentNode(defaultNodeProps);
    return createComponentNode({
      versionSetters,
      selector: () => selector(currentValue),
    });
  }) as Signal<Type>;

  const update = (newValue: Type) => {
    currentValue = newValue;
    temporaryEffectTriggers.clear();
    computedTriggers.toArray().forEach((trigger) => trigger());
    new Set([...effectTriggers, ...temporaryEffectTriggers.toArray()]).forEach(
      (trigger) => trigger(),
    );
    temporaryEffectTriggers.clear();

    versionSetters.toArray().forEach((trigger) => trigger());
  };

  const loopCheck = () => {
    const currentEffectTrigger = getCurrentRunningEffectTrigger();
    const currentComputedTrigger = getCurrentRunningComputedTrigger();
    if (
      effectTriggers.has(currentEffectTrigger) ||
      temporaryEffectTriggers.has(currentEffectTrigger) ||
      computedTriggers.has(currentComputedTrigger)
    )
      throw new LoopError();
  };

  const untrackedUpdateCheck = () => {
    if (!isUntrackEnabled()) return;
    const currentUpdateTimestamp = Date.now();
    const delay = currentUpdateTimestamp - lastUpdateTimestamp;
    if (delay > 1000) {
      updateCount = 0;
      lastUpdateTimestamp = currentUpdateTimestamp;
    }
    if (
      ++updateCount > TooManyUntrackUpdatesError.MAX_UNTRACK_UPDATES_PER_SEC
    ) {
      throw new TooManyUntrackUpdatesError();
    }
  };

  signal.get = (getter?: <R = Type>(value: Type) => R) => {
    if (!isUntrackEnabled()) addSignal(signal);
    if (getter) return getter(currentValue);
    return currentValue;
  };

  signal.set = (value: Type) => {
    if (!isUntrackEnabled()) addSignal(signal);
    loopCheck();
    if (value === currentValue) return currentValue;
    currentValue = value;
    computedDirtySetters.toArray().forEach((setter) => setter());
    untrackedUpdateCheck();

    if (isBatching())
      addBatch({
        computedTriggers,
        effectTriggers,
        temporaryEffectTriggers,
        versionSetters,
      });
    else lazyCall(() => update(value));

    return currentValue;
  };

  signal.update = (setter: (value: Type) => Type) => {
    if (!isUntrackEnabled()) addSignal(signal);
    loopCheck();
    const newValue = setter(currentValue);
    if (newValue === currentValue) return currentValue;
    currentValue = newValue;
    computedDirtySetters.toArray().forEach((setter) => setter());
    untrackedUpdateCheck();

    if (isBatching())
      addBatch({
        computedTriggers,
        effectTriggers,
        temporaryEffectTriggers,
        versionSetters,
      });
    else lazyCall(() => update(newValue));

    return currentValue;
  };

  signal.mutate = (mutator: (value: Type) => void) => {
    const { cloneValue, hasChanges, changes } = createValueManager<Type>();
    if (!isUntrackEnabled()) addSignal(signal);
    loopCheck();
    cloneValue(currentValue);
    mutator(currentValue);
    cloneValue(currentValue);
    if (!hasChanges()) return currentValue;
    computedDirtySetters.toArray().forEach((setter) => setter());
    untrackedUpdateCheck();

    if (isBatching())
      addBatch({
        computedTriggers,
        effectTriggers,
        temporaryEffectTriggers,
        versionSetters,
      });
    else lazyCall(() => update(changes().at(0)!.newValue));

    return currentValue;
  };

  signal.forceUpdate = () => {
    update(currentValue);
  };

  signal.forceNotifyEffects = () => {
    [...effectTriggers].forEach((trigger) => trigger());
  };

  setProtected(signal, {
    _addEffect(trigger: () => void) {
      effectTriggers.add(trigger);
    },

    _removeEffect(trigger: () => void) {
      effectTriggers.delete(trigger);
    },

    _addComputed(trigger: () => void) {
      computedTriggers.add(trigger);
    },

    _removeComputed(trigger: () => void) {
      computedTriggers.delete(trigger);
    },

    _addTemporaryEffect(trigger: () => void) {
      temporaryEffectTriggers.add(trigger);
    },

    _addComputedDirtySetter(setter: () => void) {
      computedDirtySetters.add(setter);
    },

    _removeComputedDirtySetter(setter: () => void) {
      computedDirtySetters.delete(setter);
    },

    _creatorFunction: creatorFunction,
  });

  return signal;
}

const creatorFunction = signal;
