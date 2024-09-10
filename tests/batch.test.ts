import {
  startRequestAnimationFrame,
  stopRequestAnimationFrame,
} from '../polyfills/requestAnimationFrame';
import { batch, effect, signal } from '../src';

jest.useRealTimers();

describe('-------------------- Batch tests --------------------\n', () => {
  test('batch used for run effect once after signal changed', async () => {
    startRequestAnimationFrame(60);

    const values: number[] = [];
    const s = signal(0);
    const trigger = jest.fn(() => values.push(s.get()));

    effect(trigger);

    batch(() => {
      s.set(1);
      s.set(2);
      s.set(3);
      s.set(4);
      s.set(5);
    });

    expect(trigger).toHaveBeenCalledTimes(1);
    expect(values).toEqual([0]);

    const { added, maxInQueue } = await stopRequestAnimationFrame();

    expect(trigger).toHaveBeenCalledTimes(2);
    expect(values).toEqual([0, 5]);

    expect(added).toBe(1);
    expect(maxInQueue).toBe(1);
  }, 1000);

  test('batch used for run effect once after every signal changed', async () => {
    startRequestAnimationFrame(60);

    const s0 = signal(0);
    const s1 = signal(0);
    const trigger = jest.fn(() => {
      s0.get();
      s0.get();
    });

    effect(trigger);

    batch(() => {
      s0.set(1);
      s0.set(2);
      s0.set(3);

      s1.set(1);
      s1.set(2);
      s1.set(3);
    });

    expect(trigger).toHaveBeenCalledTimes(1);

    const { added, maxInQueue } = await stopRequestAnimationFrame();

    expect(trigger).toHaveBeenCalledTimes(2);

    expect(added).toBe(1);
    expect(maxInQueue).toBe(1);
  }, 1000);
});
