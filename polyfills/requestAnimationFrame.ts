const queue = new Set<() => void>();
let idx = 0;
let maxInQueue = 0;
const cancelCallbacks = new Map<number, () => void>();

function requestAnimationFrame(cb: FrameRequestCallback) {
  const id = idx++;
  const cancel = () => cancelCallbacks.delete(id);
  cancelCallbacks.set(id, cancel);
  queue.add(() => {
    cancelCallbacks.delete(id);
    cb(-1);
  });
  maxInQueue = Math.max(maxInQueue, queue.size);

  return id;
}

function cancelAnimationFrame(id: number) {
  cancelCallbacks.get(id)?.();
}

export const getCurrentMaxInQueue = () => maxInQueue;
export const getLastRequestIdx = () => idx;

let intervaleId = null! as ReturnType<typeof setInterval>;
export function startRequestAnimationFrame(fps: number = 60) {
  if (intervaleId) return;
  intervaleId = setInterval(() => {
    const cbs = [...queue];
    queue.clear();
    cbs.forEach((cb) => {
      cb();
    });
  }, 1000 / fps);
}

export function stopRequestAnimationFrame(): Promise<{
  maxInQueue: number;
  added: number;
}> {
  if (!intervaleId) return Promise.resolve({ maxInQueue: 0, added: 0 });
  return new Promise((resolve) => {
    const checkTick = () => {
      if (cancelCallbacks.size === 0) {
        clearInterval(intervaleId);
        intervaleId = null!;
        const added = idx;
        const maxInQueueTmp = maxInQueue;
        maxInQueue = 0;
        idx = 0;
        resolve({ added, maxInQueue: maxInQueueTmp });
      } else {
        setTimeout(checkTick);
      }
    };
    setTimeout(checkTick);
  });
}

global.requestAnimationFrame = requestAnimationFrame;
global.cancelAnimationFrame = cancelAnimationFrame;
