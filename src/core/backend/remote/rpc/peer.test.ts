import { describe, expect, it } from "vitest";

import { TaskCancelledError } from "core/dl/cancel";

import { BackendError } from "../../errors";
import { createLoopbackPair } from "../transports/loopback";
import { RPC_CODES, RpcClosedError, RpcRemoteError } from "./errors";
import { RpcPeer } from "./peer";

const pair = () => {
  const [a, b] = createLoopbackPair();
  return { client: new RpcPeer(a), server: new RpcPeer(b) };
};

const abortedAt = (signal: AbortSignal) =>
  new Promise<void>((resolve) =>
    signal.addEventListener("abort", () => resolve(), { once: true }),
  );

describe("RpcPeer", () => {
  it("answers a request from either side", async () => {
    const { client, server } = pair();
    server.onRequest("echo", (params) => params);
    client.onRequest("double", (params) => (params as number) * 2);

    expect(await client.request("echo", { a: 1 })).toEqual({ a: 1 });
    expect(await server.request("double", 21)).toBe(42);
  });

  it("delivers notifications without a response", async () => {
    const { client, server } = pair();
    const seen: unknown[] = [];
    server.onNotification("hello", (params) => seen.push(params));

    client.notify("hello", { from: "client" });
    await new Promise((r) => setTimeout(r, 0));
    expect(seen).toEqual([{ from: "client" }]);
  });

  it("carries binary payloads larger than a frame intact", async () => {
    const { client, server } = pair();
    const blob = Uint8Array.from(
      { length: 5 * 1024 * 1024 },
      (_, i) => i % 251,
    );
    server.onRequest("size", (params) => {
      const { data } = params as { data: Uint8Array };
      return { length: data.byteLength, last: data[data.byteLength - 1], data };
    });

    const result = await client.request<{
      length: number;
      last: number;
      data: Uint8Array;
    }>("size", { data: blob });
    expect(result.length).toBe(blob.byteLength);
    expect(result.last).toBe(blob[blob.byteLength - 1]);
    expect(Buffer.compare(Buffer.from(result.data), Buffer.from(blob))).toBe(0);
  });

  it("reports an unknown method", async () => {
    const { client } = pair();
    await expect(client.request("nope")).rejects.toMatchObject({
      name: "RpcRemoteError",
      code: RPC_CODES.METHOD_NOT_FOUND,
    });
  });

  it("maps a BackendError across the wire and back", async () => {
    const { client, server } = pair();
    server.onRequest("fail", () => {
      throw new BackendError("MODEL_NOT_FOUND", 'No model "x"');
    });

    const error = await client
      .request<never>("fail")
      .catch((e: unknown) => e as Error & { code?: unknown });
    expect(error).toBeInstanceOf(BackendError);
    expect(error.code).toBe("MODEL_NOT_FOUND");
    expect(error.message).toBe('No model "x"');
  });

  it("maps an unexpected handler failure to an internal error", async () => {
    const { client, server } = pair();
    server.onRequest("boom", () => {
      throw new TypeError("bad");
    });

    const error = await client
      .request<never>("boom")
      .catch((e: unknown) => e as Error & { code?: unknown });
    expect(error).toBeInstanceOf(RpcRemoteError);
    expect(error.code).toBe(RPC_CODES.INTERNAL_ERROR);
    expect(error.message).toBe("bad");
  });

  it("streams progress to the caller before the result", async () => {
    const { client, server } = pair();
    server.onRequest("work", async (params, { progress }) => {
      expect(
        (params as { progressToken?: string }).progressToken,
      ).toBeDefined();
      for (const percent of [10, 50, 100]) progress({ percent, message: "…" });
      return "done";
    });

    const seen: unknown[] = [];
    const result = await client.request(
      "work",
      { n: 1 },
      {
        onProgress: (value) => seen.push(value),
      },
    );
    expect(result).toBe("done");
    expect(seen.map((v) => (v as { percent: number }).percent)).toEqual([
      10, 50, 100,
    ]);
  });

  it("cancels an in-flight request through the handler's signal", async () => {
    const { client, server } = pair();
    server.onRequest("slow", async (_params, { signal }) => {
      await abortedAt(signal);
      throw new TaskCancelledError();
    });

    const controller = new AbortController();
    const promise = client.request("slow", undefined, {
      signal: controller.signal,
    });
    await new Promise((r) => setTimeout(r, 0));
    controller.abort();

    await expect(promise).rejects.toBeInstanceOf(TaskCancelledError);
  });

  it("lets a cancelled handler still answer with a partial result", async () => {
    const { client, server } = pair();
    server.onRequest("slow", async (_params, { signal }) => {
      await abortedAt(signal);
      return { cancelled: true, added: 2 };
    });

    const controller = new AbortController();
    const promise = client.request("slow", undefined, {
      signal: controller.signal,
    });
    await new Promise((r) => setTimeout(r, 0));
    controller.abort();

    expect(await promise).toEqual({ cancelled: true, added: 2 });
  });

  it("rejects a request whose signal is already aborted without sending it", async () => {
    const { client, server } = pair();
    let calls = 0;
    server.onRequest("x", () => ++calls);
    const controller = new AbortController();
    controller.abort();

    await expect(
      client.request("x", undefined, { signal: controller.signal }),
    ).rejects.toBeInstanceOf(TaskCancelledError);
    await new Promise((r) => setTimeout(r, 0));
    expect(calls).toBe(0);
  });

  it("rejects pending requests when the connection closes", async () => {
    const { client, server } = pair();
    server.onRequest("forever", () => new Promise(() => {}));

    const promise = client.request("forever");
    await new Promise((r) => setTimeout(r, 0));
    server.close();

    await expect(promise).rejects.toBeInstanceOf(RpcClosedError);
    expect(client.closed).toBe(true);
  });
});
