import { createWeakCollection } from './createWeakCollection';
import { Signals } from './types';

const addSignalHandlers = createWeakCollection<(signal: Signals) => void>();
export function addSignal(signal: Signals) {
  addSignalHandlers.forEach((handler) => handler(signal));
}

export function createSignalCollector() {
  const signals = createWeakCollection<Signals>();
  const collector = (s: Signals) => {
    signals.add(s);
  };
  const disposeCollect = () => {
    addSignalHandlers.delete(collector);
  };
  const collectSignals = (preCollectedSignals: Signals[]) => {
    if (preCollectedSignals) preCollectedSignals.forEach((s) => signals.add(s));
    addSignalHandlers.add(collector);
  };

  return { signals, collectSignals, disposeCollect };
}
