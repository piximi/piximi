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

/**
 * `TaskCancelledError` crosses the worker boundary as a plain `Error`, so
 * this checks the name rather than `instanceof`.
 */
export const isTaskCancelledError = (error: unknown): boolean =>
  error instanceof Error && error.name === "TaskCancelledError";

export class CancelSource {
  #signaled = false;
  #token = new CancelToken(this);
  #whenSignaled: Promise<never> | null = null;
  #rejectWhenSignaled: ((error: TaskCancelledError) => void) | null = null;

  get token(): Token {
    return this.#token;
  }

  /**
   * Rejects with `TaskCancelledError` once `signal()` is called. Race a
   * worker call against it when the worker gets terminated on cancel: a
   * terminated worker never answers, so the call would otherwise hang.
   */
  get whenSignaled(): Promise<never> {
    if (!this.#whenSignaled) {
      this.#whenSignaled = new Promise<never>((_, reject) => {
        this.#rejectWhenSignaled = reject;
      });
      // Only consumers that race against it should observe the rejection.
      this.#whenSignaled.catch(() => {});
      if (this.#signaled) this.#rejectWhenSignaled!(new TaskCancelledError());
    }
    return this.#whenSignaled;
  }

  signal() {
    this.#signaled = true;
    this.#rejectWhenSignaled?.(new TaskCancelledError());
  }

  /**
   * Returns the token to its unsignaled state so the source can be reused for
   * a subsequent work item. Call before starting new work.
   */
  reset() {
    this.#signaled = false;
    this.#whenSignaled = null;
    this.#rejectWhenSignaled = null;
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
