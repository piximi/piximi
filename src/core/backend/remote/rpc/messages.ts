/*
 * The message envelope: JSON-RPC 2.0 shapes without the `jsonrpc` field,
 * which the frame version already implies. Mirrors `piximi_schema.rpc`.
 */

export type RequestId = number | string;

export type RequestMessage = {
  id: RequestId;
  method: string;
  params?: unknown;
};

export type ResponseMessage = { id: RequestId; result?: unknown };

export type RpcError = { code: number; message: string; data?: unknown };

export type ErrorResponseMessage = { id: RequestId | null; error: RpcError };

export type NotificationMessage = { method: string; params?: unknown };

export type Message =
  | RequestMessage
  | ResponseMessage
  | ErrorResponseMessage
  | NotificationMessage;

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

export const isMessage = (value: unknown): value is Message =>
  isRecord(value) &&
  (typeof value.method === "string" ||
    (value.id !== undefined && ("result" in value || "error" in value)));

export const isRequest = (message: Message): message is RequestMessage =>
  "method" in message && "id" in message;

export const isNotification = (
  message: Message,
): message is NotificationMessage => "method" in message && !("id" in message);

export const isErrorResponse = (
  message: Message,
): message is ErrorResponseMessage => "error" in message;

export type ProgressParams = { token: string; value: unknown };

export type CancelParams = { id: RequestId };
