import {
  startRequestAnimationFrame,
  stopRequestAnimationFrame,
} from '../polyfills/requestAnimationFrame';
import { computed, effect, signal, untrack } from '../src';

jest.useRealTimers();

describe('-------------------- Untrack tests --------------------\n', () => {
  test('untrack(signal) returns signal value', async () => {
    startRequestAnimationFrame(60);

    const s = signal(0);
    const value = untrack(s);
    expect(value).toBe(0);

    const { added, maxInQueue } = await stopRequestAnimationFrame();
    expect(added).toBe(0);
    expect(maxInQueue).toBe(0);
  }, 1000);

  test('untrack(function) returns signal value', async () => {
    startRequestAnimationFrame(60);

    const s = signal(0);
    const value = untrack(() => s.get());
    expect(value).toBe(0);

    const { added, maxInQueue } = await stopRequestAnimationFrame();
    expect(added).toBe(0);
    expect(maxInQueue).toBe(0);
  }, 1000);

  test('untrack signal in computed', async () => {
    startRequestAnimationFrame(60);

    const s0 = signal(0);
    const s1 = signal(0);

    const c = computed(() => untrack(s0) + s1.get());

    expect(c.get()).toBe(0);

    s0.set(1);

    expect(c.get()).toBe(0);

    s1.set(1);

    expect(c.get()).toBe(2);

    const { added, maxInQueue } = await stopRequestAnimationFrame();

    expect(added).toBe(2);
    expect(maxInQueue).toBe(2);
  }, 1000);

  test('untrack signal in effect', async () => {
    startRequestAnimationFrame(60);

    const s0 = signal(0);
    const s1 = signal(0);
    const trigger = jest.fn(() => {
      untrack(s0);
      s1.get();
    });

    effect(trigger);
    s0.set(1);

    expect(trigger).toHaveBeenCalledTimes(1);

    const { added, maxInQueue } = await stopRequestAnimationFrame();

    expect(trigger).toHaveBeenCalledTimes(1);

    expect(added).toBe(1);
    expect(maxInQueue).toBe(1);
  }, 1000);

  test('untrack signal triggers own effect', async () => {
    startRequestAnimationFrame(60);

    const s0 = signal(0);
    const s1 = signal(0);
    const trigger0 = jest.fn(() => {
      const value = s0.get();
      untrack(() => {
        s1.set(value);
      });
    });
    effect(trigger0);

    const trigger1 = jest.fn(() => {
      s1.get();
    });
    effect(trigger1);

    s0.set(99);
    expect(s1.get()).toBe(0);

    const { added, maxInQueue } = await stopRequestAnimationFrame();

    expect(trigger0).toHaveBeenCalledTimes(2);
    expect(trigger1).toHaveBeenCalledTimes(2);
    expect(s1.get()).toBe(99);

    expect(added).toBe(2);
    expect(maxInQueue).toBe(1);
  }, 1000);
});
