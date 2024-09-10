import {
  startRequestAnimationFrame,
  stopRequestAnimationFrame,
} from '../polyfills/requestAnimationFrame';
import {
  computed,
  effect,
  signal,
  SignalLoopError,
  SignalTooManyUntrackUpdatesError,
  untrack,
} from '../src';

jest.useRealTimers();

describe('-------------------- Loop tests --------------------\n', () => {
  test('loop in effect', async () => {
    startRequestAnimationFrame(60);

    const s = signal(0);
    let err = null;
    const trigger = jest.fn(() => {
      try {
        s.update((v) => v + 1);
      } catch (error) {
        err = error;
      }
    });

    effect(trigger);

    const { added, maxInQueue } = await stopRequestAnimationFrame();

    expect(err).toEqual(new SignalLoopError());

    expect(trigger).toHaveBeenCalledTimes(2);
    expect(added).toBe(1);
    expect(maxInQueue).toBe(1);
  }, 1000);

  test('loop in computed', async () => {
    startRequestAnimationFrame(60);

    const s = signal(0);

    const trigger = jest.fn(() => {
      try {
        s.update((v) => v + 1);
        return s.get();
      } catch (error) {
        return error;
      }
    });

    const c = computed(trigger);

    const { added, maxInQueue } = await stopRequestAnimationFrame();

    expect(c.get()).toEqual(new SignalLoopError());
    expect(trigger).toHaveBeenCalledTimes(2);

    expect(added).toBe(1);
    expect(maxInQueue).toBe(1);
  }, 1000);

  test('avoid loop in effect with untrack', async () => {
    startRequestAnimationFrame(60);

    const s = signal(0);
    const trigger = jest.fn(() => {
      untrack(() => s.update((v) => v + 1));
    });

    effect(trigger);

    expect(trigger).toHaveBeenCalledTimes(1);

    const { added, maxInQueue } = await stopRequestAnimationFrame();

    expect(trigger).toHaveBeenCalledTimes(1);

    expect(added).toBe(1);
    expect(maxInQueue).toBe(1);
  }, 1000);

  test('avoid loop in computed with untrack', async () => {
    startRequestAnimationFrame(60);

    const s = signal(0);
    const trigger = jest.fn(() => {
      return untrack(() => s.update((v) => v + 1));
    });

    const c = computed(trigger);

    expect(trigger).toHaveBeenCalledTimes(1);

    const { added, maxInQueue } = await stopRequestAnimationFrame();

    expect(trigger).toHaveBeenCalledTimes(1);
    expect(c.get()).toBe(1);

    expect(added).toBe(1);
    expect(maxInQueue).toBe(1);
  }, 1000);

  test('change signal before untrack in computed loop', async () => {
    startRequestAnimationFrame(60);

    const s = signal(0);

    const trigger = jest.fn(() => {
      try {
        s.update((v) => v + 1);
        return untrack(() => s.update((v) => v + 1));
      } catch (error) {
        return error;
      }
    });

    const c = computed(trigger);

    const { added, maxInQueue } = await stopRequestAnimationFrame();

    expect(c.get()).toEqual(new SignalLoopError());
    expect(trigger).toHaveBeenCalledTimes(3);

    expect(added).toBe(2);
    expect(maxInQueue).toBe(2);
  }, 1000);

  test('change signal after untrack in computed loop', async () => {
    startRequestAnimationFrame(60);

    const s = signal(0);

    const trigger = jest.fn(() => {
      try {
        untrack(() => s.update((v) => v + 1));
        s.update((v) => v + 1);

        return s.get();
      } catch (error) {
        return error;
      }
    });

    const c = computed(trigger);

    const { added, maxInQueue } = await stopRequestAnimationFrame();

    expect(c.get()).toEqual(new SignalLoopError());
    expect(trigger).toHaveBeenCalledTimes(2);

    expect(added).toBe(2);
    expect(maxInQueue).toBe(2);
  }, 1000);

  test('set s1 -> c1 -> untrack(s2) -> c2 -> set s1 <- loop', async () => {
    startRequestAnimationFrame(60);

    const s1 = signal(0);
    const s2 = signal(0);

    const c1 = computed(() => {
      const value = s1.get();
      return untrack(() => s2.set(value + 1));
    });

    const c2 = computed(() => {
      try {
        const value = s2.get();
        return s1.set(value);
      } catch (error) {
        return error;
      }
    });

    await stopRequestAnimationFrame();

    expect(c2.get()).toEqual(new SignalLoopError());
  }, 1000);

  test('set s1 -> c1 -> untrack(set s2) -> c2 -> untrack(set s1) -> c1 -> untrack(set s2) <- loop', async () => {
    startRequestAnimationFrame(60);

    const s1 = signal(0);
    const s2 = signal(0);

    const c1 = computed(() => {
      try {
        const value = s1.get();
        return untrack(() => s2.set(value + 1));
      } catch (error) {
        return error;
      }
    });

    const c2 = computed(() => {
      try {
        const value = s2.get();
        return untrack(() => s1.set(value + 1));
      } catch (error) {
        return error;
      }
    });

    await stopRequestAnimationFrame();

    expect(c1.get()).toEqual(new SignalTooManyUntrackUpdatesError());
    expect(c2.get()).toEqual(new SignalTooManyUntrackUpdatesError());
  }, 1000);
});
