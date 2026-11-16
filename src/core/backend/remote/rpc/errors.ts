import { TaskCancelledError, isTaskCancelledError } from "core/dl/cancel";

import { BackendError } from "../../errors";

import type { BackendErrorCode } from "../../errors";
import type { RpcError } from "./messages";

export const RPC_CODES = {
  PARSE_ERROR: -32700,
  INVALID_REQUEST: -32600,
  METHOD_NOT_FOUND: -32601,
  INVALID_PARAMS: -32602,
  INTERNAL_ERROR: -32603,
  /* As in the Language Server Protocol. */
  REQUEST_CANCELLED: -32800,
  /* A backend operation failed; `data` is `{ code, message }`. */
  BACKEND_ERROR: -32000,
} as const;

/* An error the other peer reported that maps to nothing more specific. */
export class RpcRemoteError extends Error {
  readonly code: number;
  readonly data: unknown;

  constructor(error: RpcError) {
    super(error.message);
    this.name = "RpcRemoteError";
    this.code = error.code;
    this.data = error.data;
  }
}

/* The connection went away with requests still pending. */
export class RpcClosedError extends Error {
  constructor(reason?: Error) {
    super(
      reason ? `Connection closed: ${reason.message}` : "Connection closed",
    );
    this.name = "RpcClosedError";
    this.cause = reason;
  }
}

const isBackendErrorData = (
  data: unknown,
): data is { code: BackendErrorCode; message: string } =>
  typeof data === "object" &&
  data !== null &&
  typeof (data as { code?: unknown }).code === "string";

/* What a handler threw, as the error response it becomes. */
export const toRpcError = (error: unknown): RpcError => {
  if (isTaskCancelledError(error)) {
    return { code: RPC_CODES.REQUEST_CANCELLED, message: "Request cancelled" };
  }
  if (error instanceof BackendError) {
    return {
      code: RPC_CODES.BACKEND_ERROR,
      message: error.message,
      data: { code: error.code, message: error.message },
    };
  }
  if (error instanceof RpcRemoteError) {
    return { code: error.code, message: error.message, data: error.data };
  }
  return {
    code: RPC_CODES.INTERNAL_ERROR,
    message: error instanceof Error ? error.message : String(error),
  };
};

/* An error response, as the error a caller should see. */
export const fromRpcError = (error: RpcError): Error => {
  if (error.code === RPC_CODES.REQUEST_CANCELLED) {
    return new TaskCancelledError(error.message);
  }
  if (
    error.code === RPC_CODES.BACKEND_ERROR &&
    isBackendErrorData(error.data)
  ) {
    return new BackendError(error.data.code, error.data.message);
  }
  return new RpcRemoteError(error);
};
