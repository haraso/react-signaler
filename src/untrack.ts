import { isReadonlySignalOrSignal, ReadonlySignal, Signal } from './types';

interface untrack {
  <R>(signal: Signal<R>): R;
  <R>(readonlySignal: ReadonlySignal<R>): R;
  <R>(cb: () => R): R;
}

let _isUntrackEnabled = false;
export const isUntrackEnabled = () => _isUntrackEnabled;

export const untrack: untrack = function untrack<R>(
  cbOrSignal: (() => R) | Signal<R> | ReadonlySignal<R>,
): R {
  _isUntrackEnabled = true;
  let returnValue: R = undefined!;
  if (isReadonlySignalOrSignal(cbOrSignal)) {
    returnValue = cbOrSignal.get();
  } else {
    returnValue = cbOrSignal() as R;
  }
  _isUntrackEnabled = false;
  return returnValue;
} as untrack;
