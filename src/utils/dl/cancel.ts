export type Token = Int32Array;

const INIT_VAL_IDX = 0;

const SIGNAL_F = 0;
const SIGNAL_T = 1;

/*
 * Error class used by `CancelSource.throwIfSignaled` to abort a worker thread's current work.
 */
export class TaskCancelledError extends Error {
  constructor(message?: string, options?: ErrorOptions) {
    super(message, options);
    // Comlink serializes a thrown error to { name, message, stack } and
    // rebuilds a plain Error on the main thread, so `instanceof` won't hold
    // across the worker boundary — callers must identify it by `name`.
    this.name = "TaskCancelledError";
  }
}

export class CancelSource {
  #buffer;
  #tokenArray;
  /**
   * @param initialValue Initial value to store in the shared array buffer's first slot.
   */
  constructor() {
    if (globalThis.crossOriginIsolated !== undefined && !crossOriginIsolated) {
      throw new Error(
        "Cannot operate:  Cross origin is not isolated. See https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/SharedArrayBuffer#security_requirements for details.",
      );
    }
    this.#buffer = new SharedArrayBuffer(4);
    this.#tokenArray = new Int32Array(this.#buffer);
    Atomics.store(this.#tokenArray, INIT_VAL_IDX, SIGNAL_F);
  }

  get token(): Token {
    return this.#tokenArray;
  }

  signal() {
    Atomics.store(this.token, INIT_VAL_IDX, SIGNAL_T);
  }

  /**
   * Returns the token to its unsignaled state so the source can be reused for
   * a subsequent work item. Call before starting new work.
   */
  reset() {
    Atomics.store(this.token, INIT_VAL_IDX, SIGNAL_F);
  }

  /**
   * Checks whether or not a cancellation source's token is in its signaled state.
   *
   * This method may be used by worker threads in polling mode.
   * @param token Token to check.
   * @returns `true` if the token is signaled, or `false` otherwise.
   */
  static isSignaled(token: Token) {
    return Atomics.load(token, INIT_VAL_IDX) === SIGNAL_T;
  }
  /**
   * Checks the given cancellation token and throws an instance of `TaskCancelledError` if the token is in its
   * signaled state.
   * @param token Cancellation token to check.
   */
  static throwIfSignaled(token: Token | undefined) {
    if (!token) {
      return;
    }
    if (this.isSignaled(token)) {
      throw new TaskCancelledError();
    }
  }
}
