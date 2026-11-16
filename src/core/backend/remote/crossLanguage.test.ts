// @vitest-environment node
import { spawn } from "node:child_process";
import path from "node:path";

import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { TaskCancelledError } from "core/dl/cancel";

import { BackendError } from "../errors";
import { PROTOCOL_VERSION } from "../protocol/methods";
import { RpcPeer } from "./rpc/peer";
import { WebSocketTransport } from "./transports/websocket";

import type { ChildProcess } from "node:child_process";

/*
 * The TypeScript peer against the Python one (`piximi-link-echo`), over a
 * real WebSocket. Needs `uv` and the python/ workspace, so it only runs when
 * PIXIMI_REMOTE_TEST=1 (the protocol CI job sets it).
 */
const enabled = process.env.PIXIMI_REMOTE_TEST === "1";
const root = path.resolve(__dirname, "../../../..");

const startEchoServer = () =>
  new Promise<{ process: ChildProcess; url: string }>((resolve, reject) => {
    const child = spawn(
      "uv",
      ["run", "--project", "python", "piximi-link-echo"],
      {
        cwd: root,
        stdio: ["ignore", "pipe", "inherit"],
      },
    );
    let output = "";
    child.stdout!.on("data", (chunk: Buffer) => {
      output += chunk.toString();
      const match = /PORT (\d+)/.exec(output);
      if (match) resolve({ process: child, url: `ws://127.0.0.1:${match[1]}` });
    });
    child.on("exit", (code) =>
      reject(new Error(`echo server exited with ${code} before listening`)),
    );
  });

describe.runIf(enabled)("TypeScript peer ↔ Python peer", () => {
  let server: ChildProcess;
  let peer: RpcPeer;

  beforeAll(async () => {
    const started = await startEchoServer();
    server = started.process;
    peer = new RpcPeer(await WebSocketTransport.connect(started.url));
  }, 60_000);

  afterAll(() => {
    peer?.close();
    server?.kill();
  });

  it("round-trips a request", async () => {
    expect(await peer.request("echo", { x: [1, 2, 3], s: "é" })).toEqual({
      x: [1, 2, 3],
      s: "é",
    });
  });

  it("carries a multi-frame binary both ways", async () => {
    const blob = Uint8Array.from(
      { length: 4 * 1024 * 1024 },
      (_, i) => i % 251,
    );
    const result = await peer.request<{
      length: number;
      last: number;
      data: Uint8Array;
    }>("bytes", { data: blob });
    expect(result.length).toBe(blob.byteLength);
    expect(result.last).toBe(blob[blob.byteLength - 1]);
    expect(Buffer.compare(Buffer.from(result.data), Buffer.from(blob))).toBe(0);
  });

  it("streams progress", async () => {
    const seen: number[] = [];
    const result = await peer.request(
      "progress",
      { steps: [5, 95] },
      {
        onProgress: (value) =>
          seen.push((value as { percent: number }).percent),
      },
    );
    expect(result).toBe("done");
    expect(seen).toEqual([5, 95]);
  });

  it("cancels a request", async () => {
    const controller = new AbortController();
    const promise = peer.request("slow", undefined, {
      signal: controller.signal,
    });
    await new Promise((r) => setTimeout(r, 50));
    controller.abort();
    await expect(promise).rejects.toBeInstanceOf(TaskCancelledError);
  });

  it("receives a partial result from a cancelled request", async () => {
    const controller = new AbortController();
    const promise = peer.request("slow-partial", undefined, {
      signal: controller.signal,
    });
    await new Promise((r) => setTimeout(r, 50));
    controller.abort();
    expect(await promise).toEqual({ cancelled: true, added: 2 });
  });

  it("maps a BackendError", async () => {
    const error = await peer
      .request<never>("fail")
      .catch((e: unknown) => e as Error & { code?: unknown });
    expect(error).toBeInstanceOf(BackendError);
    expect(error.code).toBe("MODEL_NOT_FOUND");
  });

  it("rejects a protocol major-version mismatch at initialize", async () => {
    const error = await peer
      .request<never>("initialize", {
        protocolVersion: "99.0.0",
        clientInfo: { name: "test", version: "0" },
        clientCapabilities: [],
      })
      .catch((e: unknown) => e as Error & { code?: unknown });
    expect(error).toBeInstanceOf(BackendError);
    expect(error.code).toBe("NOT_SUPPORTED");
  });

  it("completes the handshake and answers a server→client request", async () => {
    const pinged = new Promise<unknown>((resolve) =>
      peer.onRequest("ping-back", (params) => {
        resolve(params);
        return "pong";
      }),
    );
    const result = await peer.request<{ protocolVersion: string }>(
      "initialize",
      {
        protocolVersion: PROTOCOL_VERSION,
        clientInfo: { name: "test", version: "0" },
        clientCapabilities: [],
      },
    );
    expect(result.protocolVersion).toBe(PROTOCOL_VERSION);
    peer.notify("initialized");
    expect(await pinged).toEqual({ from: "server" });
  });
});
