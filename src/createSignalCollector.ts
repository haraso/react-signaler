import { ReadonlySignal } from './computed';
import { createWeakCollection } from './createWeakCollection';
import { Signal } from './signal';

const addSignalHandlers =
  createWeakCollection<(signal: Signal | ReadonlySignal) => void>();
export function addSignal(signal: Signal | ReadonlySignal) {
  addSignalHandlers.forEach((handler) => handler(signal));
}

export function createSignalCollector() {
  const signals = createWeakCollection<Signal | ReadonlySignal>();
  const collector = (s: Signal | ReadonlySignal) => {
    signals.add(s);
  };
  const disposeCollect = () => {
    addSignalHandlers.delete(collector);
  };
  const collectSignals = (preCollectedSignals: (Signal | ReadonlySignal)[]) => {
    if (preCollectedSignals) preCollectedSignals.forEach((s) => signals.add(s));
    addSignalHandlers.add(collector);
  };

  return { signals, collectSignals, disposeCollect };
}
