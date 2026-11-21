// @vitest-environment node
import { execFileSync, spawn } from "node:child_process";
import {
  copyFileSync,
  mkdirSync,
  mkdtempSync,
  realpathSync,
  rmSync,
} from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";

import { afterAll, describe, expect, it } from "vitest";

import { describeBackendConformance } from "../conformance/backendConformance";
import { RemoteBackend } from "./RemoteBackend";

import type { ChildProcess } from "node:child_process";

/*
 * The remote backend against a real `piximi serve` over a WebSocket, through
 * the same conformance suite the local and fake backends pass. Needs `uv`
 * and the python/ workspace, so it only runs with PIXIMI_REMOTE_TEST=1.
 */
const enabled = process.env.PIXIMI_REMOTE_TEST === "1";
const root = path.resolve(__dirname, "../../../..");
const uv = (args: string[]) =>
  ["uv", ["run", "--project", "python", ...args]] as const;

const startServer = (imagesDir: string) =>
  new Promise<{ process: ChildProcess; url: string }>((resolve, reject) => {
    const [command, args] = uv([
      "piximi",
      "serve",
      imagesDir,
      "--port",
      "0",
      "--no-gpu",
      "--no-auth",
    ]);
    const child = spawn(command, args, {
      cwd: root,
      stdio: ["ignore", "pipe", "inherit"],
    });
    let output = "";
    child.stdout!.on("data", (chunk: Buffer) => {
      output += chunk.toString();
      const match = /PORT (\d+)/.exec(output);
      if (match)
        resolve({ process: child, url: `ws://127.0.0.1:${match[1]}/ws` });
    });
    child.on("exit", (code) =>
      reject(new Error(`piximi serve exited with ${code} before listening`)),
    );
  });

const processes: ChildProcess[] = [];
const folders: string[] = [];

afterAll(() => {
  for (const child of processes) child.kill();
  for (const folder of folders)
    rmSync(folder, { recursive: true, force: true });
});

if (enabled) {
  describeBackendConformance("RemoteBackend", async () => {
    const imagesDir = mkdtempSync(path.join(tmpdir(), "piximi-images-"));
    folders.push(imagesDir);
    const [command, args] = uv([
      "python",
      "-m",
      "piximi_engine.testing.fixtures",
      imagesDir,
    ]);
    execFileSync(command, args, { cwd: root, stdio: "inherit" });
    // A subfolder the startup scan leaves alone, for `ingest.paths`.
    const stacks = path.join(imagesDir, "stacks");
    mkdirSync(stacks);
    for (const name of ["pages6.tif", "pages12.tif", "garbage.bin"]) {
      copyFileSync(
        path.join(
          root,
          "python/packages/piximi-engine/tests/vectors/tiff",
          name,
        ),
        path.join(stacks, name),
      );
    }

    const server = await startServer(imagesDir);
    processes.push(server.process);
    const backend = await RemoteBackend.connect(server.url);

    const page = await backend.query.images({}, { limit: 100 });
    return {
      backend,
      serverFiles: { root: realpathSync(imagesDir) },
      images: page.items.map((record) => ({
        id: record.image.id,
        name: record.image.name,
        width: record.image.shape.width,
        height: record.image.shape.height,
        channelIds: record.channels.map((c) => c.id),
      })),
    };
  });
}

describe.runIf(enabled)("RemoteBackend", () => {
  it("rejects a connection to nothing", async () => {
    await expect(
      RemoteBackend.connect("ws://127.0.0.1:1/ws"),
    ).rejects.toThrow();
  });
});
