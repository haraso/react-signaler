import { WeakCollection } from './createWeakCollection';
import { lazyCall } from './lazyCall';

const batchVersionSetters: Set<WeakCollection<() => void>> = new Set();
const batchComputedTriggers: Set<WeakCollection<() => void>> = new Set();
const batchEffectTriggers: Set<Set<() => void>> = new Set();
const batchTemporaryEffectTriggers: Set<WeakCollection<() => void>> = new Set();

export function addBatch({
  computedTriggers,
  effectTriggers,
  temporaryEffectTriggers,
  versionSetters,
}: {
  versionSetters: WeakCollection<() => void>;
  computedTriggers: WeakCollection<() => void>;
  effectTriggers: Set<() => void>;
  temporaryEffectTriggers: WeakCollection<() => void>;
}) {
  batchVersionSetters.add(versionSetters);
  batchComputedTriggers.add(computedTriggers);
  batchEffectTriggers.add(effectTriggers);
  batchTemporaryEffectTriggers.add(temporaryEffectTriggers);
}

let _isBatching = false;
export const isBatching = () => _isBatching;

export function batch<R>(cb: () => R): R {
  _isBatching = true;
  const result = cb();
  _isBatching = false;

  const merge = (set: Set<WeakCollection<() => void> | Set<() => void>>) => {
    const result = new Set<() => void>();
    set.forEach((collection) => {
      collection.forEach((trigger) => result.add(trigger));
    });
    return result;
  };

  lazyCall(() => {
    batchTemporaryEffectTriggers.forEach((temporaryEffectTriggers) => {
      temporaryEffectTriggers.clear();
    });

    const computedTriggers = merge(batchComputedTriggers);
    batchComputedTriggers.clear();
    computedTriggers.forEach((trigger) => trigger());

    const effectTriggers = new Set([
      ...merge(batchEffectTriggers),
      ...merge(batchTemporaryEffectTriggers),
    ]);
    batchEffectTriggers.clear();
    effectTriggers.forEach((trigger) => trigger());

    batchTemporaryEffectTriggers.forEach((temporaryEffectTriggers) => {
      temporaryEffectTriggers.clear();
    });
    batchTemporaryEffectTriggers.clear();

    merge(batchVersionSetters).forEach((trigger) => trigger());
    batchVersionSetters.clear();
  });
  return result;
}
