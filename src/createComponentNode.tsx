import { FC, ReactNode, useEffect, useState } from 'react';
import { SignalStateBase } from './types';

const MAX_COUNTED_VERSIONS = 1000;

const SignalValueNode: FC<{
  state: SignalStateBase;
  selector: () => ReactNode;
}> = ({ selector, state }) => {
  const [_, setter] = useState(0);
  useEffect(() => {
    const handler = () => setter((v) => (v + 1) % MAX_COUNTED_VERSIONS);
    state.versionSetters.add(handler);
    return () => {
      state.versionSetters.delete(handler);
    };
  }, []);
  return selector();
};

const SignalComponentNode: FC<{
  state: SignalStateBase;
  selector: () => ReactNode;
}> = ({ selector, state }) => {
  const [_, setter] = useState(0);
  useEffect(() => {
    const handler = () => setter((v) => (v + 1) % MAX_COUNTED_VERSIONS);
    state.versionSetters.add(handler);
    return () => {
      state.versionSetters.delete(handler);
    };
  }, []);
  return selector();
};

export function createComponentNode(
  {
    state,
    selector,
  }: {
    state: SignalStateBase;
    selector: () => ReactNode;
  },
  isDefault?: boolean,
) {
  if (isDefault) return <SignalValueNode state={state} selector={selector} />;
  else return <SignalComponentNode state={state} selector={selector} />;
}
