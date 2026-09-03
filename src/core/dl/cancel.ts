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

/**
 * Read-only view of a `CancelSource`'s signaled state. This is the object
 * handed to a worker — via `Comlink.proxy()` — so `isSignaled()` calls made
 * there resolve over a postMessage round trip against the live main-thread
 * `CancelSource`, rather than needing a `SharedArrayBuffer`.
 */
export class CancelToken {
  #source: CancelSource;

  constructor(source: CancelSource) {
    this.#source = source;
  }

  isSignaled() {
    return this.#source.isSignaled();
  }
}

export type Token = CancelToken;

export class CancelSource {
  #signaled = false;
  #token = new CancelToken(this);

  get token(): Token {
    return this.#token;
  }

  signal() {
    this.#signaled = true;
  }

  /**
   * Returns the token to its unsignaled state so the source can be reused for
   * a subsequent work item. Call before starting new work.
   */
  reset() {
    this.#signaled = false;
  }

  isSignaled() {
    return this.#signaled;
  }

  /**
   * Checks whether or not a cancellation source's token is in its signaled state.
   *
   * This method may be used by worker threads in polling mode. `token` is
   * typically a Comlink proxy, so the check is always asynchronous.
   * @param token Token to check.
   * @returns `true` if the token is signaled, or `false` otherwise.
   */
  static async isSignaled(token: Token) {
    return token.isSignaled();
  }
  /**
   * Checks the given cancellation token and throws an instance of `TaskCancelledError` if the token is in its
   * signaled state.
   * @param token Cancellation token to check.
   */
  static async throwIfSignaled(token: Token | undefined) {
    if (!token) {
      return;
    }
    if (await this.isSignaled(token)) {
      throw new TaskCancelledError();
    }
  }
}
