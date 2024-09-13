import { ReactNode } from 'react';
import { computed } from './computed';
import { WeakCollection } from './createWeakCollection';
import { signal } from './signal';

export interface SignalsProtectedPart {
  _addEffect(trigger: () => void): void;
  _removeEffect(trigger: () => void): void;
  _addComputed(trigger: () => void): void;
  _removeComputed(trigger: () => void): void;
  _addTemporaryEffect(trigger: () => void): void;
  _addComputedDirtySetter(setter: () => void): void;
  _removeComputedDirtySetter(setter: () => void): void;
  _creatorFunction: typeof computed | typeof signal;
}

const protectedKey = Symbol('protected');

export type Signal<Type = any> = {
  (): ReactNode;
  (selector: (value: Type) => ReactNode): ReactNode;
  get(): Type;
  get(getter: <R = Type>(value: Type) => R): Type;
  set(value: Type): Type;
  update(updater: (value: Type) => Type): Type;
  mutate(mutator: (value: Type) => void): Type;
  forceUpdate(): void;
  forceNotifyEffects(): void;
  [protectedKey]: SignalsProtectedPart;
};

export interface SignalStateBase<Type = any> {
  versionSetters: WeakCollection<() => void>;
  computedTriggers: WeakCollection<() => void>;
  computedDirtySetters: WeakCollection<() => void>;
  effectTriggers: Set<() => void>;
  temporaryEffectTriggers: WeakCollection<() => void>;
  currentValue: Type;
}

export interface SignalState<Type = any> extends SignalStateBase<Type> {
  updateCount: number;
  lastUpdateTimestamp: number;
}

export type ReadonlySignal<Type = any> = {
  (): ReactNode;
  (selector: (value: Type) => ReactNode): ReactNode;
  get(): Type;
  get(select: <R = Type>(value: Type) => R): Type;
  forceRecompute(): void;
  forceNotifyEffects(): void;
  [protectedKey]: SignalsProtectedPart;
};

export interface ReadonlySignalState<Type = any> extends SignalStateBase<Type> {
  isDirty: boolean;
}

export type Signals = Signal | ReadonlySignal;

export function getProtected(signal: Signals): SignalsProtectedPart {
  return signal[protectedKey];
}

export function setProtected(
  signal: Signals,
  protectedPart: SignalsProtectedPart,
) {
  signal[protectedKey] = protectedPart;
}

export function isReadonlySignalOrSignal(entity: any): entity is Signals {
  return Boolean(
    getProtected(entity)?._creatorFunction === computed ||
      getProtected(entity)?._creatorFunction === signal,
  );
}

export function isSignal(entity: any): entity is Signal {
  return Boolean(getProtected(entity)?._creatorFunction === signal);
}

export function isReadonlySignal(entity: any): entity is ReadonlySignal {
  return Boolean(getProtected(entity)?._creatorFunction === computed);
}
