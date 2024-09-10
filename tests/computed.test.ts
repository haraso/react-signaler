import {
  startRequestAnimationFrame,
  stopRequestAnimationFrame,
} from '../polyfills/requestAnimationFrame';
import { computed, effect, signal } from '../src';

jest.useRealTimers();

describe('-------------------- Computed tests --------------------\n', () => {
  test('computed.get() 0', async () => {
    startRequestAnimationFrame(60);

    const c = computed(() => 0);
    expect(c.get()).toBe(0);

    const { added, maxInQueue } = await stopRequestAnimationFrame();
    expect(added).toBe(0);
    expect(maxInQueue).toBe(0);
  }, 1000);

  test('computed.get() is memoized 0', async () => {
    startRequestAnimationFrame(60);
    const return0 = jest.fn(() => 0);
    const c = computed(return0);

    expect(c.get()).toBe(0);

    expect(c.get()).toBe(0);

    expect(return0).toHaveBeenCalledTimes(1);

    const { added, maxInQueue } = await stopRequestAnimationFrame();
    expect(added).toBe(0);
    expect(maxInQueue).toBe(0);
  }, 1000);

  test('computed.forceRecompute() value changed 0 to 1', async () => {
    startRequestAnimationFrame(60);
    let value = 0;
    const return0 = jest.fn(() => value);
    const c = computed(return0);
    const effectCallback = jest.fn(() => c.get());

    effect(effectCallback);

    expect(c.get()).toBe(0);
    value++;
    c.forceRecompute();

    expect(c.get()).toBe(1);

    expect(return0).toHaveBeenCalledTimes(2);
    expect(effectCallback).toHaveBeenCalledTimes(2);

    const { added, maxInQueue } = await stopRequestAnimationFrame();
    expect(added).toBe(0);
    expect(maxInQueue).toBe(0);
  }, 1000);

  test('computed.forceRecompute() value not changed', async () => {
    // TODO
    startRequestAnimationFrame(60);
    const c = computed(() => 0);
    const effectCallback = jest.fn(() => c.get());

    effect(effectCallback);

    c.forceRecompute();

    expect(effectCallback).toHaveBeenCalledTimes(1);

    const { added, maxInQueue } = await stopRequestAnimationFrame();
    expect(added).toBe(0);
    expect(maxInQueue).toBe(0);
  }, 1000);

  test('computed.forceNotifyEffects()', async () => {
    // TODO
    startRequestAnimationFrame(60);
    let value = 0;
    const c = computed(() => 0);
    const effectCallback = jest.fn(() => c.get());

    effect(effectCallback);

    c.forceNotifyEffects();

    expect(effectCallback).toHaveBeenCalledTimes(2);

    const { added, maxInQueue } = await stopRequestAnimationFrame();
    expect(added).toBe(0);
    expect(maxInQueue).toBe(0);
  }, 1000);

  test('computed updates on signal change', async () => {
    startRequestAnimationFrame(60);

    const s = signal(0);
    const return_s_value = jest.fn(() => s.get());

    const c = computed(return_s_value);

    expect(c.get()).toBe(0);

    s.set(1);

    expect(c.get()).toBe(1);

    expect(return_s_value).toHaveBeenCalledTimes(2);

    const { added, maxInQueue } = await stopRequestAnimationFrame();
    expect(added).toBe(1);
    expect(maxInQueue).toBe(1);
  }, 1000);

  test('computed updates on computed change', async () => {
    startRequestAnimationFrame(60);

    let value = 0;
    const c0 = computed(() => value);

    const return_s_value = jest.fn(() => c0.get());
    const c1 = computed(return_s_value);

    expect(c1.get()).toBe(0);

    value++;
    c0.forceRecompute();

    expect(c1.get()).toBe(1);

    expect(return_s_value).toHaveBeenCalledTimes(2);

    const { added, maxInQueue } = await stopRequestAnimationFrame();
    expect(added).toBe(0);
    expect(maxInQueue).toBe(0);
  }, 1000);

  test('computed updates on computed changed by signal', async () => {
    startRequestAnimationFrame(60);

    const s = signal(0);
    const c0 = computed(() => s.get());

    const return_s_value = jest.fn(() => c0.get());
    const c1 = computed(return_s_value);

    expect(c1.get()).toBe(0);

    s.set(1);

    expect(c1.get()).toBe(1);

    expect(return_s_value).toHaveBeenCalledTimes(2);

    const { added, maxInQueue } = await stopRequestAnimationFrame();
    expect(added).toBe(1);
    expect(maxInQueue).toBe(1);
  }, 1000);
});
