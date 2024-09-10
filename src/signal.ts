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
import { isUntrackEnabled } from './untrack';

export type Signal<Type = any> = {
  (selector?: (value: Type) => ReactNode): ReactNode;
  get(): Type;
  get(getter: <R = Type>(value: Type) => R): Type;
  set(value: Type): Type;
  update(updater: (value: Type) => Type): Type;
  mutate(mutator: (value: Type) => void): Type;
  forceUpdate(): void;
  forceNotifyEffects(): void;
  _addEffect(trigger: () => void): void;
  _removeEffect(trigger: () => void): void;
  _addComputed(trigger: () => void): void;
  _removeComputed(trigger: () => void): void;
  _addTemporaryEffect(trigger: () => void): void;
  _addComputedDirtySetter(setter: () => void): void;
  _removeComputedDirtySetter(setter: () => void): void;
  _creatorFunction: <Type>(value: Type) => Signal<Type>;
};

export function signal<Type>(value: Type) {
  const versionSetters = createWeakCollection<() => void>();
  const computedTriggers = createWeakCollection<() => void>();
  const computedDirtySetters = createWeakCollection<() => void>();
  const effectTriggers = new Set<() => void>();
  const temporaryEffectTriggers = createWeakCollection<() => void>();
  let updateCount = 0;
  let lastUpdateTimestamp = Date.now();

  let currentValue = value;

  const signal = ((selector?: (value: Type) => ReactNode) => {
    if (!selector)
      return createComponentNode({
        versionSetters,
        selector: () => currentValue as ReactNode,
      });

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

  signal._addEffect = (trigger: () => void) => {
    effectTriggers.add(trigger);
  };

  signal._removeEffect = (trigger: () => void) => {
    effectTriggers.delete(trigger);
  };

  signal._addComputed = (trigger: () => void) => {
    computedTriggers.add(trigger);
  };

  signal._removeComputed = (trigger: () => void) => {
    computedTriggers.delete(trigger);
  };

  signal._addTemporaryEffect = (trigger: () => void) => {
    temporaryEffectTriggers.add(trigger);
  };

  signal._addComputedDirtySetter = (setter: () => void) => {
    computedDirtySetters.add(setter);
  };

  signal._removeComputedDirtySetter = (setter: () => void) => {
    computedDirtySetters.delete(setter);
  };

  signal._creatorFunction = creatorFunction;

  return signal;
}

const creatorFunction = signal;
