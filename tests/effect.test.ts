import {
  startRequestAnimationFrame,
  stopRequestAnimationFrame,
} from '../polyfills/requestAnimationFrame';
import { computed, effect, lazyEffect, signal } from '../src';

jest.useRealTimers();

describe('-------------------- Effect tests --------------------\n', () => {
  test('effect runs once on initialized', async () => {
    startRequestAnimationFrame(60);

    const trigger = jest.fn();
    effect(trigger);
    expect(trigger).toHaveBeenCalledTimes(1);

    const { added, maxInQueue } = await stopRequestAnimationFrame();
    expect(added).toBe(0);
    expect(maxInQueue).toBe(0);
  }, 1000);

  test('effect runs again by dispose.forceTrigger()', async () => {
    startRequestAnimationFrame(60);

    const trigger = jest.fn();
    const dispose = effect(trigger);
    dispose.forceTrigger();
    expect(trigger).toHaveBeenCalledTimes(2);

    const { added, maxInQueue } = await stopRequestAnimationFrame();
    expect(added).toBe(0);
    expect(maxInQueue).toBe(0);
  }, 1000);

  test('effect runs when signal changes', async () => {
    startRequestAnimationFrame(60);

    const s = signal(0);
    const trigger = jest.fn(() => s.get());

    effect(trigger);
    s.set(1);

    const { added, maxInQueue } = await stopRequestAnimationFrame();

    expect(trigger).toHaveBeenCalledTimes(2);

    expect(added).toBe(1);
    expect(maxInQueue).toBe(1);
  }, 1000);

  test('effect run once dispose() before signal changes', async () => {
    startRequestAnimationFrame(60);

    const s = signal(0);
    const trigger = jest.fn(() => s.get());

    const dispose = effect(trigger);
    dispose();
    s.set(1);

    const { added, maxInQueue } = await stopRequestAnimationFrame();

    expect(trigger).toHaveBeenCalledTimes(1);

    expect(added).toBe(1);
    expect(maxInQueue).toBe(1);
  }, 1000);

  test('effect run once dispose() after signal changes', async () => {
    startRequestAnimationFrame(60);

    const s = signal(0);
    const trigger = jest.fn(() => s.get());

    const dispose = effect(trigger);
    s.set(1);
    dispose();

    const { added, maxInQueue } = await stopRequestAnimationFrame();

    expect(trigger).toHaveBeenCalledTimes(1);

    expect(added).toBe(1);
    expect(maxInQueue).toBe(1);
  }, 1000);

  test('effect run once dispose(...signals) from one signal', async () => {
    startRequestAnimationFrame(60);

    const s0 = signal(0);
    const s1 = signal(0);
    const trigger = jest.fn(() => {
      s0.get();
      s1.get();
    });

    const dispose = effect(trigger);
    dispose(s0);
    s0.set(1);
    s1.set(1);

    expect(trigger).toHaveBeenCalledTimes(1);

    const { added, maxInQueue } = await stopRequestAnimationFrame();

    expect(trigger).toHaveBeenCalledTimes(2);

    expect(added).toBe(2);
    expect(maxInQueue).toBe(2);
  }, 1000);

  test('effect dispose(...signals) not permanent with multiple signals', async () => {
    startRequestAnimationFrame(60);

    const s0 = signal(0);
    const s1 = signal(0);
    const trigger = jest.fn(() => {
      s0.get();
      s1.get();
    });

    const dispose = effect(trigger);
    dispose(s0);
    s0.set(1);
    s1.set(1);

    expect(trigger).toHaveBeenCalledTimes(1);

    const { added: added1, maxInQueue: maxInQueue1 } =
      await stopRequestAnimationFrame();

    expect(trigger).toHaveBeenCalledTimes(2);

    expect(added1).toBe(2);
    expect(maxInQueue1).toBe(2);

    startRequestAnimationFrame(60);

    s0.set(2);

    const { added: added2, maxInQueue: maxInQueue2 } =
      await stopRequestAnimationFrame();

    expect(trigger).toHaveBeenCalledTimes(3);

    expect(added2).toBe(1);
    expect(maxInQueue2).toBe(1);
  }, 1000);

  test('effect runs after each signal changes', async () => {
    startRequestAnimationFrame(60);

    const values: number[] = [];
    const s = signal(0);
    const trigger = jest.fn(() => values.push(s.get()));

    effect(trigger);
    s.set(1);
    s.set(2);
    s.set(3);
    s.set(4);
    s.set(5);

    expect(trigger).toHaveBeenCalledTimes(1);
    expect(values).toEqual([0]);

    const { added, maxInQueue } = await stopRequestAnimationFrame();

    expect(trigger).toHaveBeenCalledTimes(6);
    expect(values).toEqual([0, 1, 2, 3, 4, 5]);

    expect(added).toBe(5);
    expect(maxInQueue).toBe(5);
  }, 1000);

  test('effects are not effecting each other', async () => {
    startRequestAnimationFrame(60);

    const s0 = signal(0);
    const s1 = signal(0);
    const trigger0 = jest.fn(() => s0.get());
    const trigger1 = jest.fn(() => s1.get());

    effect(trigger0);
    effect(trigger1);
    s0.set(1);

    expect(trigger0).toHaveBeenCalledTimes(1);
    expect(trigger1).toHaveBeenCalledTimes(1);

    const { added, maxInQueue } = await stopRequestAnimationFrame();

    expect(trigger0).toHaveBeenCalledTimes(2);
    expect(trigger1).toHaveBeenCalledTimes(1);

    expect(added).toBe(1);
    expect(maxInQueue).toBe(1);
  }, 1000);

  test('effect not runs when signal not changes', async () => {
    startRequestAnimationFrame(60);

    const s = signal(0);
    const trigger = jest.fn(() => s.get());

    effect(trigger);
    s.set(0);

    expect(trigger).toHaveBeenCalledTimes(1);

    const { added, maxInQueue } = await stopRequestAnimationFrame();

    expect(trigger).toHaveBeenCalledTimes(1);

    expect(added).toBe(0);
    expect(maxInQueue).toBe(0);
  }, 1000);

  test('effect not runs when computed not changes', async () => {
    startRequestAnimationFrame(60);

    const s = signal(2);
    const c = computed(() => (s.get() % 2 === 0 ? 'even' : 'odd'));
    const trigger = jest.fn(() => c.get());

    effect(trigger);
    s.set(4);

    expect(trigger).toHaveBeenCalledTimes(1);

    const { added, maxInQueue } = await stopRequestAnimationFrame();

    expect(trigger).toHaveBeenCalledTimes(1);

    expect(added).toBe(1);
    expect(maxInQueue).toBe(1);
  }, 1000);

  test('effect can watch multiple signals', async () => {
    startRequestAnimationFrame(60);

    const s0 = signal(0);
    const s1 = signal(0);
    const trigger = jest.fn();

    effect(trigger, [s0, s1]);
    s0.set(1);
    s1.set(1);

    expect(trigger).toHaveBeenCalledTimes(1);

    const { added, maxInQueue } = await stopRequestAnimationFrame();

    expect(trigger).toHaveBeenCalledTimes(3);

    expect(added).toBe(2);
    expect(maxInQueue).toBe(2);
  }, 1000);

  test('lazyEffect runs only when signals changes', async () => {
    startRequestAnimationFrame(60);

    const s0 = signal(0);
    const s1 = signal(0);
    const trigger = jest.fn();

    lazyEffect(trigger, [s0, s1]);
    s0.set(1);
    s1.set(1);

    expect(trigger).toHaveBeenCalledTimes(0);

    const { added, maxInQueue } = await stopRequestAnimationFrame();

    expect(trigger).toHaveBeenCalledTimes(2);

    expect(added).toBe(2);
    expect(maxInQueue).toBe(2);
  }, 1000);
});
