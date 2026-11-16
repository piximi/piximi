import { TaskCancelledError } from "core/dl/cancel";

import { decodeMessage, encodeMessage } from "./codec";
import { RPC_CODES, RpcClosedError, fromRpcError, toRpcError } from "./errors";
import { frameMessage, Reassembler } from "./framing";
import { isErrorResponse, isNotification, isRequest } from "./messages";

import type {
  CancelParams,
  Message,
  ProgressParams,
  RequestId,
  RpcError,
} from "./messages";
import type { Transport } from "./transport";

type ProgressListener = (value: unknown) => void;

type RequestOptions = {
  signal?: AbortSignal;
  /* Receives `$/progress` values for this request; a token is added to params. */
  onProgress?: ProgressListener;
};

type HandlerContext = {
  /* Aborted when the caller sends `$/cancelRequest`. */
  signal: AbortSignal;
  /* Sends a `$/progress` value if the caller asked for progress. */
  progress: (value: unknown) => void;
};

type RequestHandler = (
  params: unknown,
  context: HandlerContext,
) => Promise<unknown> | unknown;

type NotificationHandler = (params: unknown) => void;

type Pending = {
  resolve: (value: unknown) => void;
  reject: (error: Error) => void;
  progressToken?: string;
};

const PROGRESS = "$/progress";
const CANCEL = "$/cancelRequest";

/*
 * A symmetric JSON-RPC peer: either side may send requests, notifications,
 * progress for a request in flight, and cancellation, in the manner of the
 * Language Server Protocol. The frontend's remote backend and the Python
 * `piximi_link.Peer` are instances of the same design.
 */
export class RpcPeer {
  readonly #transport: Transport;
  readonly #reassembler = new Reassembler();
  #seq = 0;
  #nextId = 1;
  #closed = false;

  readonly #pending = new Map<RequestId, Pending>();
  readonly #progress = new Map<string, ProgressListener>();
  readonly #inflight = new Map<RequestId, AbortController>();
  readonly #requestHandlers = new Map<string, RequestHandler>();
  readonly #notificationHandlers = new Map<string, NotificationHandler>();
  readonly #closeListeners = new Set<(reason?: Error) => void>();

  constructor(transport: Transport) {
    this.#transport = transport;
    transport.onFrame((frame) => this.#receive(frame));
    transport.onClose((reason) => this.#handleClose(reason));
  }

  // ── Outgoing ───────────────────────────────────────────────────────────────

  request<T = unknown>(
    method: string,
    params?: unknown,
    options: RequestOptions = {},
  ): Promise<T> {
    const { signal, onProgress } = options;
    if (this.#closed) return Promise.reject(new RpcClosedError());
    if (signal?.aborted) return Promise.reject(new TaskCancelledError());

    const id = this.#nextId++;
    let progressToken: string | undefined;
    if (onProgress) {
      progressToken = String(id);
      this.#progress.set(progressToken, onProgress);
      params = { ...(params as object | undefined), progressToken };
    }

    return new Promise<T>((resolve, reject) => {
      this.#pending.set(id, {
        resolve: resolve as (value: unknown) => void,
        reject,
        progressToken,
      });
      // The request stays pending after a cancel: the other side decides
      // whether to answer with a partial result or a cancellation error.
      signal?.addEventListener(
        "abort",
        () => {
          if (this.#pending.has(id))
            this.notify(CANCEL, { id } as CancelParams);
        },
        { once: true },
      );
      this.#send({ id, method, params });
    });
  }

  notify(method: string, params?: unknown): void {
    if (this.#closed) return;
    this.#send({ method, params });
  }

  // ── Incoming ───────────────────────────────────────────────────────────────

  onRequest(method: string, handler: RequestHandler): () => void {
    this.#requestHandlers.set(method, handler);
    return () => {
      this.#requestHandlers.delete(method);
    };
  }

  onNotification(method: string, handler: NotificationHandler): () => void {
    this.#notificationHandlers.set(method, handler);
    return () => {
      this.#notificationHandlers.delete(method);
    };
  }

  // ── Lifecycle ──────────────────────────────────────────────────────────────

  get closed(): boolean {
    return this.#closed;
  }

  onClose(listener: (reason?: Error) => void): () => void {
    this.#closeListeners.add(listener);
    return () => {
      this.#closeListeners.delete(listener);
    };
  }

  close(): void {
    this.#transport.close();
    this.#handleClose();
  }

  // ── Internals ──────────────────────────────────────────────────────────────

  #send(message: Message): void {
    const payload = encodeMessage(message);
    for (const frame of frameMessage(
      payload,
      this.#seq++,
      this.#transport.maxFrameBytes,
    )) {
      this.#transport.send(frame);
    }
  }

  #receive(frame: Uint8Array): void {
    let message: Message;
    try {
      const payload = this.#reassembler.push(frame);
      if (!payload) return;
      message = decodeMessage(payload);
    } catch (error) {
      this.#send({
        id: null,
        error: {
          code: RPC_CODES.PARSE_ERROR,
          message: (error as Error).message,
        },
      });
      return;
    }

    if (isRequest(message)) {
      void this.#handleRequest(message.id, message.method, message.params);
    } else if (isNotification(message)) {
      this.#handleNotification(message.method, message.params);
    } else if (isErrorResponse(message)) {
      if (message.id !== null)
        this.#settle(message.id, undefined, message.error);
    } else {
      this.#settle(message.id, message.result);
    }
  }

  async #handleRequest(
    id: RequestId,
    method: string,
    params: unknown,
  ): Promise<void> {
    const handler = this.#requestHandlers.get(method);
    if (!handler) {
      this.#send({
        id,
        error: {
          code: RPC_CODES.METHOD_NOT_FOUND,
          message: `Unknown method "${method}"`,
        },
      });
      return;
    }
    const controller = new AbortController();
    this.#inflight.set(id, controller);
    const token = (params as { progressToken?: unknown } | undefined)
      ?.progressToken;
    const context: HandlerContext = {
      signal: controller.signal,
      progress: (value) => {
        if (typeof token === "string") {
          this.notify(PROGRESS, { token, value } as ProgressParams);
        }
      },
    };
    try {
      const result = await handler(params, context);
      if (!this.#closed) this.#send({ id, result });
    } catch (error) {
      if (!this.#closed) this.#send({ id, error: toRpcError(error) });
    } finally {
      this.#inflight.delete(id);
    }
  }

  #handleNotification(method: string, params: unknown): void {
    if (method === CANCEL) {
      this.#inflight.get((params as CancelParams).id)?.abort();
      return;
    }
    if (method === PROGRESS) {
      const { token, value } = params as ProgressParams;
      this.#progress.get(token)?.(value);
      return;
    }
    this.#notificationHandlers.get(method)?.(params);
  }

  #settle(id: RequestId, result: unknown, error?: RpcError): void {
    const pending = this.#pending.get(id);
    if (!pending) return;
    this.#pending.delete(id);
    if (pending.progressToken) this.#progress.delete(pending.progressToken);
    if (error) pending.reject(fromRpcError(error));
    else pending.resolve(result);
  }

  #handleClose(reason?: Error): void {
    if (this.#closed) return;
    this.#closed = true;
    const error = new RpcClosedError(reason);
    for (const pending of this.#pending.values()) pending.reject(error);
    this.#pending.clear();
    this.#progress.clear();
    for (const controller of this.#inflight.values()) controller.abort();
    for (const listener of this.#closeListeners) listener(reason);
  }
}
