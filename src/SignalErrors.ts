export class LoopError extends Error {
  name = 'LoopError';

  constructor() {
    super(
      'Loop detected' +
        '\n' +
        'Try to use the untrack() feature to avoid signal loops',
    );

    Object.setPrototypeOf(this, LoopError.prototype);
  }
}

export class TooManyUntrackUpdatesError extends Error {
  static MAX_UNTRACK_UPDATES_PER_SEC = 10;
  name = 'TooManyUntrackUpdatesError';

  constructor() {
    super(
      'Passible loop detected. There was too many untracked updates in one signal!' +
        '\n' +
        'Try to use the batch() feature or set TooManyUntrackUpdatesError.MAX_UNTRACK_UPDATES_PER_SEC higher.' +
        '\n' +
        'default: 10' +
        '\n' +
        `current: ${TooManyUntrackUpdatesError.MAX_UNTRACK_UPDATES_PER_SEC}`,
    );

    Object.setPrototypeOf(this, LoopError.prototype);
  }
}
