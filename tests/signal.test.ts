import {
  startRequestAnimationFrame,
  stopRequestAnimationFrame,
} from '../polyfills/requestAnimationFrame';
import { effect, signal } from '../src';

jest.useRealTimers();

describe('-------------------- Signal tests --------------------\n', () => {
  test('signal.get() 0', async () => {
    startRequestAnimationFrame(60);

    const s = signal(0);
    expect(s.get()).toBe(0);

    const { added, maxInQueue } = await stopRequestAnimationFrame();
    expect(added).toBe(0);
    expect(maxInQueue).toBe(0);
  }, 1000);

  test('signal.set() 0 to 1', async () => {
    startRequestAnimationFrame(60);

    const s = signal(0);
    s.set(1);
    expect(s.get()).toBe(1);

    const { added, maxInQueue } = await stopRequestAnimationFrame();
    expect(added).toBe(1);
    expect(maxInQueue).toBe(1);
  }, 1000);

  test('signal.update() 0 to 1', async () => {
    startRequestAnimationFrame(60);

    const s = signal(0);
    s.update((v) => v + 1);
    expect(s.get()).toBe(1);

    const { added, maxInQueue } = await stopRequestAnimationFrame();
    expect(added).toBe(1);
    expect(maxInQueue).toBe(1);
  }, 1000);

  test('signal.get() {value: 0}', async () => {
    startRequestAnimationFrame(60);

    const s = signal({ value: 0 });
    expect(s.get()).toEqual({ value: 0 });

    const { added, maxInQueue } = await stopRequestAnimationFrame();
    expect(added).toBe(0);
    expect(maxInQueue).toBe(0);
  }, 1000);

  test('signal.set() {value: 0} to {value: 1}', async () => {
    startRequestAnimationFrame(60);

    const s = signal({ value: 0 });
    s.set({ value: 1 });
    expect(s.get()).toEqual({ value: 1 });

    const { added, maxInQueue } = await stopRequestAnimationFrame();
    expect(added).toBe(1);
    expect(maxInQueue).toBe(1);
  }, 1000);

  test('signal.update() {value: 0} to {value: 1}', async () => {
    startRequestAnimationFrame(60);

    const s = signal({ value: 0 });
    s.update((state) => ({ ...state, value: 1 }));
    expect(s.get()).toEqual({ value: 1 });

    const { added, maxInQueue } = await stopRequestAnimationFrame();
    expect(added).toBe(1);
    expect(maxInQueue).toBe(1);
  }, 1000);

  test('signal.mutate() {value: 0} to {value: 1}', async () => {
    startRequestAnimationFrame(60);

    const s = signal({ value: 0 });
    s.mutate((state) => (state.value = 1));
    expect(s.get()).toEqual({ value: 1 });

    const { added, maxInQueue } = await stopRequestAnimationFrame();
    expect(added).toBe(1);
    expect(maxInQueue).toBe(1);
  }, 1000);

  test('signal.forceNotifyEffects()', async () => {
    startRequestAnimationFrame(60);

    const s = signal(0);
    const effectCallback = jest.fn(() => s.get());
    effect(effectCallback);
    s.forceNotifyEffects();

    expect(effectCallback).toHaveBeenCalledTimes(2);

    const { added, maxInQueue } = await stopRequestAnimationFrame();
    expect(added).toBe(0);
    expect(maxInQueue).toBe(0);
  }, 1000);
});
