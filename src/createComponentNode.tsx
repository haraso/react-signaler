import { ReactNode, FC, useState, useEffect } from "react";
import { WeakCollection } from "./createWeakCollection";

export function createComponentNode({
  versionSetters, selector,
}: {
  versionSetters: WeakCollection<() => void>;
  selector: () => ReactNode;
}) {
  const Component: FC = (() => {
    const [_, setter] = useState(0);
    useEffect(() => {
      const handler = () => setter((v) => v + 1);
      versionSetters.add(handler);
      return () => {
        versionSetters.delete(handler);
      };
    }, []);
    return selector();
  }) as FC;
  const node = <Component />;
  return node;
}
