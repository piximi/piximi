import type { ErrorCode } from "core/dl/types";

export type BackendErrorCode = ErrorCode | "NOT_SUPPORTED" | "NOT_FOUND";

/*
 * Failure of a backend call. Backend methods reject rather than returning a
 * result union, so the same error surfaces whether the work ran in a worker
 * or on the other end of a socket. Cancellation is not a `BackendError`; it
 * is a `TaskCancelledError` (see `core/dl/cancel`).
 */
export class BackendError extends Error {
  readonly code: BackendErrorCode;

  constructor(code: BackendErrorCode, message: string, options?: ErrorOptions) {
    super(message, options);
    this.name = "BackendError";
    this.code = code;
  }
}
