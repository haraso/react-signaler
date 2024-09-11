import { FC, ReactNode, useEffect, useState } from 'react';
import { WeakCollection } from './createWeakCollection';

const MAX_COUNTED_VERSIONS = 1000;

const Component: FC<{
  versionSetters: WeakCollection<() => void>;
  selector: () => ReactNode;
}> = ({ selector, versionSetters }) => {
  const [_, setter] = useState(0);
  useEffect(() => {
    const handler = () => setter((v) => (v + 1) % MAX_COUNTED_VERSIONS);
    versionSetters.add(handler);
    return () => {
      versionSetters.delete(handler);
    };
  }, []);
  return selector();
};

export function createComponentNode({
  versionSetters,
  selector,
}: {
  versionSetters: WeakCollection<() => void>;
  selector: () => ReactNode;
}) {
  return <Component versionSetters={versionSetters} selector={selector} />;
}
