export type WeakCollection<T extends object> = {
  add(value: T): void;
  delete(value: T): void;
  clear(): void;
  has(value: T): boolean;
  forEach(iteratorFunc: (item: T) => void): void;
  map<R>(iteratorFunc: (item: T) => R): R[];
  find(iteratorFunc: (item: T) => boolean): T | undefined;
  filter(iteratorFunc: (item: T) => boolean): T[];
  size(): number;
  toArray(): T[];
};

export function createWeakCollection<T extends object>(): WeakCollection<T> {
  const set = new Set<() => T | undefined>();
  let refs = new WeakSet();

  return {
    add(value: T) {
      if (refs.has(value)) return;
      const ref = new WeakRef(value);
      refs.add(value);
      const cb = () => {
        const value = ref.deref();
        if (!value) {
          console.log('cleared');
          set.delete(cb);
          return;
        }
        return value;
      };
      set.add(cb);
    },
    delete(value: T) {
      if (!refs.has(value)) return set.forEach((cb) => cb());
      refs.delete(value);
      for (const cb of set) {
        if (value === cb()) {
          set.delete(cb);
          return;
        }
      }
    },
    clear() {
      refs = new WeakSet();
      set.clear();
    },
    has(value: T) {
      return refs.has(value);
    },
    forEach(iteratorFunc: (item: T) => void) {
      for (const cb of set) {
        const value = cb();
        if (value) iteratorFunc(value);
      }
    },
    map<R>(iteratorFunc: (item: T) => R): R[] {
      const r: R[] = [];
      for (const cb of set) {
        const value = cb();
        if (value) r.push(iteratorFunc(value));
      }
      return r;
    },
    find(iteratorFunc: (item: T) => boolean): T | undefined {
      for (const cb of set) {
        const value = cb();
        if (value && iteratorFunc(value)) return value;
      }
    },
    filter(iteratorFunc: (item: T) => boolean): T[] {
      const r: T[] = [];
      for (const cb of set) {
        const value = cb();
        if (value && iteratorFunc(value)) r.push(value);
      }
      return r;
    },
    size() {
      set.forEach((cb) => cb());
      return set.size;
    },
    toArray() {
      return [...set].map((cb) => cb()).filter((v) => Boolean(v)) as T[];
    },
  };
}
