import { computed, ReadonlySignal } from './computed';
import { signal, Signal } from './signal';

export function isReadonlySignalOrSignal(
  entity: any,
): entity is Signal | ReadonlySignal {
  return Boolean(
    entity._creatorFunction === computed || entity._creatorFunction === signal,
  );
}

export function isSignal(entity: any): entity is Signal {
  return Boolean(entity._creatorFunction === signal);
}

export function isReadonlySignal(entity: any): entity is ReadonlySignal {
  return Boolean(entity._creatorFunction === computed);
}
