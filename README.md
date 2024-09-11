# react-signal

## Based on: https://github.com/tc39/proposal-signals

**!IMPORTANT!** - This is not [preact](https://preactjs.com/) library like this [@preact/signals-react](https://www.npmjs.com/package/@preact/signals-react). This library is made for [react](https://react.dev/).

## Usage

- [signal\<Type\>(value: Type): Signal\<Type\>](#signal)
  - [Signal with atomic value](#signal-atomic-value)
  - [Signal with object value](#signal-object-value)
  - [Get Signal value](#signal-get-value)
  - [Set Signal value](#signal-set-value)
  - [Update Signal value](#signal-update-value)
  - [Mutate Signal value](#signal-mutate-value)
  - [Use Signal value in react component](#signal-value-in-component)
  - [useSignal() Create Signal in react component](#signal-inside-component)
- [computed\<Type\>(compute: ()=>Type, watch?: (Signal | ReadonlySignal)[]): ReadonlySignal\<Type\>](#computed)
  - [Create Computed](#computed-create)
  - [Create Computed object value](#computed-create-object-value)
  - [useComputed() Create Computed in react component](#computed-inside-component)
- [effect(handler: ()=>void, watch?: (Signal | ReadonlySignal)[]): Dispose](#effect)
  - [Create effect](#effect-create)
  - [Dispose effect](#effect-dispose)
  - [useSignalEffect() Create Effect in react component](#effect-inside-component)
- [lazyEffect(handler: ()=>void, watch: (Signal | ReadonlySignal)[]): Dispose](#lazy-effect)
  - [Create Lazy Effect](#lazy-effect-create)
  - [Create Lazy Effect inside react component](#lazy-effect-inside-component)
- [Features](#features)
  - [batch\<R\>(cb: () => R): R](#feature-batch)
  - [untrack\<R\>(signal: Signal\<R\>): R<br/>untrack\<R\>(signal: ReadonlySignal\<R\>): R<br/>untrack\<R\>(cb: () => R): R](#feature-untrack)

<a id="signal"></a>

### signal\<Type\>(value: Type): Signal\<Type\>

<a id="signal-atomic-value"></a>
Signal with atomic value

```tsx
import { signal } from 'react-signal';

const num = signal(5);

const Component: FC = () => {
  return <h1>Num: {num()}</h1>;
};
```

<a id="signal-object-value"></a>
Signal with object value

```tsx
import { signal } from 'react-signal';

const num = signal({ num: 5 });

const Component: FC = () => {
  return <h1>Num: {num((value) => value.num)}</h1>;
};
```

<a id="signal-get-value"></a>
Get Signal value

```tsx
import { signal } from 'react-signal';

const num = signal({ num: 5 });
console.log(num.get()); // { num: 5 }
console.log(num.get((value) => value.num)); // 5
```

<a id="signal-set-value"></a>
Set Signal value

```tsx
import { signal } from 'react-signal';

const num = signal({ num: 5 });
num.set({ num: 10 }); // { num: 10 }
```

<a id="signal-update-value"></a>
Update Signal value

```tsx
import { signal } from 'react-signal';

const num = signal({ num: 5 });
num.update((value) => ({ ...value, num: 10 })); // { num: 10 }
```

<a id="signal-mutate-value"></a>
Mutate Signal value

```tsx
import { signal } from 'react-signal';

const num = signal({ num: 5 });
num.mutate((value) => (value.num = 10)); // { num: 10 }
```

<a id="signal-value-in-component"></a>
Use Signal value in react component

```tsx
import { signal } from 'react-signal';

const text = signal('');

const Component: FC = () => {
  return (
    <div>
      <h1>text: {text()}</h1>
      {text((value) => (
        <input value={value} onChange={(ev) => text.set(ev.target.value)} />
      ))}
    </div>
  );
};
```

<a id="signal-inside-component"></a>
**useSignal()** Create Signal in react component

```tsx
import { useSignal } from 'react-signal';

const Component: FC = () => {
  const { signal } = useSignal();
  const num = signal('unique-signal-key', () => 5);

  return <h1>Num: {num()}</h1>;
};
```

<a id="computed"></a>

### computed\<Type\>(compute: ()=>Type, watch?: (Signal | ReadonlySignal)[]): ReadonlySignal\<Type\>

> **watch?: (Signal | ReadonlySignal)[]** optional argument.<br/>In some cases signals are not read in computed but depend on some signals. Watch array is useful for this cases.

> Computed values are memoized but, they are always recomputed when the related signals are changed.

<a id="computed-create"></a>
Create Computed

```tsx
import { signal, computed } from 'react-signal';

const name = signal('Peter');
const upperCaseName = computed(() => name.get().toUpperCase());

const Component: FC = () => {
  return <h1>name: {upperCaseName()}</h1>;
};
```

<a id="computed-create-object-value"></a>
Create Computed object value

```tsx
import { signal, computed } from 'react-signal';

const name = signal('Peter');
const transformedName = computed(() => ({
  upperCase: name.get().toUpperCase(),
  lowerCase: name.get().toLowerCase(),
}));

const Component: FC = () => {
  return <h1>name: {transformedName((value) => value.lowerCase)}</h1>;
};
```

<a id="computed-read-value"></a>
Read Computed value

```tsx
import { signal, computed } from 'react-signal';

const name = signal('Peter');
const transformedName = computed(() => ({
  upperCase: name.get().toUpperCase(),
  lowerCase: name.get().toLowerCase(),
}));

console.log(transformedName.get()); // { upperCase: "PETER", lowerCase: "peter" }
console.log(transformedName.get((value) => value.upperCase)); // PETER
```

<a id="computed-inside-component"></a>
**useComputed()** Create Computed in react component

```tsx
import { useSignal, useComputed } from 'react-signal';

const Component: FC = () => {
  const { signal } = useSignal();
  const { computed } = useComputed();

  const name = signal('name', () => 'Peter');
  const upperCaseName = computed('upperCaseName', () =>
    name.get().toUpperCase(),
  );

  return <h1>name: {upperCaseName()}</h1>;
};
```

<a id="effect"></a>

### effect(handler: ()=>void, watch?: (Signal | ReadonlySignal)[]): Dispose

> **watch?: (Signal | ReadonlySignal)[]** optional argument.<br/>In some cases signals are not read in effect but depend on some signals. Watch array is useful for this cases.

> Effects always run once immediately after created.

> Effects always run lazy after each related signals are changed.

<a id="effect-create"></a>
Crate effect

```tsx
import { signal, effect } from 'react-signal';

const name = signal('Peter');

const dispose = effect(() => {
  console.log(name.get());
});

// first console output: Peter

name.set('Erik');

// console output from lazy call: Erik
```

<a id="effect-dispose"></a>
Dispose effect

> Effects are disposables with **dispose(...(Signal | ReadonlySignal)[]): void** function.<br/>Example: `dispose();`

> If the effect is related to multiple signals, there is a possibility to dispose one or more signals.<br/>**Important** if some of the related signals are disposed from the effect but the effect triggered then the disposed signals automatically are subscribing again.<br/>Example: `dispose(nameSignal, ageSignal);`

<a id="effect-inside-component"></a>
**useSignalEffect()** Create Effect in react component

```tsx
import { useSignal, useComputed, useSignalEffect } from 'react-signal';

const Component: FC = () => {
  const { signal } = useSignal();
  const { computed } = useComputed();
  const { effect } = useSignalEffect();

  const name = signal('name', () => 'Peter');
  const upperCaseName = computed('upperCaseName', () =>
    name.get().toUpperCase(),
  );

  const dispose = effect('log-user-name', () => {
    console.log(upperCaseName.get());
  });

  return <h1>name: {upperCaseName()}</h1>;
};
```

<a id="lazy-effect"></a>

### lazyEffect(handler: ()=>void, watch: (Signal | ReadonlySignal)[]): Dispose

> Lazy effect almost the same as effect.

> Lazy effect only runs after each related signals are changed.

> Lazy effect **watch: (Signal | ReadonlySignal)[]** argument is required.

<a id="lazy-effect-create"></a>
Create Lazy Effect

```tsx
import { signal, lazyEffect } from 'react-signal';

const name = signal('Peter');

const dispose = lazyEffect(() => {
  console.log(name.get());
}, [name]);

name.set('Erik');

// first console output from lazy call: Erik
```

<a id="lazy-effect-inside-component"></a>
Create Lazy Effect inside react component

```tsx
import { useSignal, useComputed, useSignalLazyEffect } from 'react-signal';

const Component: FC = () => {
  const { signal } = useSignal();
  const { computed } = useComputed();
  const { lazyEffect } = useSignalLazyEffect();

  const name = signal('name', () => 'Peter');
  const upperCaseName = computed('upperCaseName', () =>
    name.get().toUpperCase(),
  );

  const dispose = lazyEffect(
    'log-user-name',
    () => {
      console.log(upperCaseName.get());
    },
    [upperCaseName],
  );

  return <h1>name: {upperCaseName()}</h1>;
};
```

<a id="features"></a>

### Features

<a id="feature-batch"></a>
batch\<R\>(cb: () => R): R

> Batch can avoid unnecessary update steps.

```jsx
import { signal, effect, batch } from 'react-signal';

const count = signal(0);

const dispose = effect(() => {
  console.log(count.get());
});

// first console output: 0

count.set(1);
count.set(2);
count.set(3);

// console output: 1
// console output: 2
// console output: 3

batch(() => {
  count.set(1);
  count.set(2);
  count.set(3);
});

// after batch console output: 3
```

<a id="feature-untrack"></a>
untrack\<R\>(signal: Signal\<R\>): R<br/>untrack\<R\>(signal: ReadonlySignal\<R\>): R<br/>untrack\<R\>(cb: () => R): R

> Untrack can avoid any subscribes.

```jsx
import { signal, effect } from 'react-signal';
import { thisFunctionReadOtherSignals } from 'somewhere';

const name = signal('');

const dispose = effect(() => {
  const name = fetchURL.get();
  untrack(() => {
    thisFunctionReadOtherSignals(name);
  });
});

name.set('Peter');
```

## Used built-in javascript features

- [requestAnimationFrame](https://caniuse.com/requestanimationframe) - [MDN](https://developer.mozilla.org/en-US/docs/Web/API/Window/requestAnimationFrame)
- [WeakSet](https://caniuse.com/mdn-javascript_builtins_weakset) - [MDN](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/WeakSet)
- [WeakRef](https://caniuse.com/mdn-javascript_builtins_weakref) - [MDN](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/WeakRef)
- [Set](https://caniuse.com/mdn-javascript_builtins_set_set) - [MDN](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Set/Set)
- [Spread syntax (...)](https://caniuse.com/mdn-javascript_operators_spread) - [MDN](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Spread_syntax)
- [Symbol](https://caniuse.com/mdn-javascript_builtins_symbol) - [MDN](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Symbol)
