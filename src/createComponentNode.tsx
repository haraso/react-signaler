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
    key,
  }: {
    state: SignalStateBase;
    selector: () => ReactNode;
    key?: string | number;
  },
  isValueNode?: boolean,
) {
  if (isValueNode)
    return <SignalValueNode key={key} state={state} selector={selector} />;
  else
    return <SignalComponentNode key={key} state={state} selector={selector} />;
}
