import { WeakCollection } from './createWeakCollection';
import { lazyCall } from './lazyCall';
import { SignalStateBase } from './types';

const batchVersionSetters: Set<WeakCollection<() => void>> = new Set();
const batchComputedTriggers: Set<WeakCollection<() => void>> = new Set();
const batchEffectTriggers: Set<Set<() => void>> = new Set();
const batchTemporaryEffectTriggers: Set<WeakCollection<() => void>> = new Set();

export function addBatch(state: SignalStateBase) {
  batchVersionSetters.add(state.versionSetters);
  batchComputedTriggers.add(state.computedTriggers);
  batchEffectTriggers.add(state.effectTriggers);
  batchTemporaryEffectTriggers.add(state.temporaryEffectTriggers);
}

let _isBatching = false;
export const isBatching = () => _isBatching;

function merge(set: Set<WeakCollection<() => void> | Set<() => void>>) {
  const result = new Set<() => void>();
  set.forEach((collection) => {
    collection.forEach((trigger) => result.add(trigger));
  });
  return result;
}

export function batch<R>(cb: () => R): R {
  _isBatching = true;
  const result = cb();
  _isBatching = false;

  lazyCall(() => {
    batchTemporaryEffectTriggers.forEach((temporaryEffectTriggers) => {
      temporaryEffectTriggers.clear();
    });

    const mergedComputedTriggers = merge(batchComputedTriggers);
    batchComputedTriggers.clear();
    mergedComputedTriggers.forEach((trigger) => trigger());

    const mergedEffectTriggers = new Set([
      ...merge(batchEffectTriggers),
      ...merge(batchTemporaryEffectTriggers),
    ]);
    batchEffectTriggers.clear();
    mergedEffectTriggers.forEach((trigger) => trigger());

    batchTemporaryEffectTriggers.forEach((temporaryEffectTriggers) => {
      temporaryEffectTriggers.clear();
    });
    batchTemporaryEffectTriggers.clear();

    const mergedVersionSetters = merge(batchVersionSetters);
    mergedVersionSetters.forEach((trigger) => trigger());
    batchVersionSetters.clear();
  });
  return result;
}
