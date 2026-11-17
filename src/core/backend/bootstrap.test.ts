import { afterEach, describe, expect, it, vi } from "vitest";

import {
  appPath,
  exchangeToken,
  resolveBasePath,
  resolveSessionConfig,
} from "./bootstrap";

const location = { search: "", protocol: "https:", host: "app.example" };

const storage = (items: Record<string, string> = {}): Storage =>
  ({
    getItem: (key: string) => items[key] ?? null,
    setItem: () => {},
    removeItem: () => {},
  }) as unknown as Storage;

describe("resolveSessionConfig", () => {
  it("prefers the URL's backend and token", () => {
    expect(
      resolveSessionConfig(
        { ...location, search: "?backend=ws://h:1/ws&token=abc" },
        { url: "/ws" },
        storage(),
      ),
    ).toEqual({ url: "ws://h:1/ws", token: "abc" });
  });

  it("resolves a served config relative to the page, matching its scheme", () => {
    expect(
      resolveSessionConfig(
        { ...location, search: "?token=t" },
        { url: "/ws" },
        storage(),
      ),
    ).toEqual({ url: "wss://app.example/ws", token: "t" });
    expect(
      resolveSessionConfig(
        { ...location, protocol: "http:" },
        { url: "/ws" },
        storage(),
      ),
    ).toEqual({ url: "ws://app.example/ws", token: undefined });
  });

  it("reuses the remembered token for a served config on a plain load", () => {
    const remembered = { url: "wss://app.example/ws", token: "k" };
    expect(
      resolveSessionConfig(
        location,
        { url: "/ws" },
        storage({ "piximi.session": JSON.stringify(remembered) }),
      ),
    ).toEqual(remembered);
    // A remembered token for some other backend does not leak.
    expect(
      resolveSessionConfig(
        { ...location, search: "?backend=ws://other:1/ws" },
        undefined,
        storage({ "piximi.session": JSON.stringify(remembered) }),
      ),
    ).toEqual({ url: "ws://other:1/ws", token: undefined });
  });

  it("falls back to the session this tab remembered", () => {
    const remembered = { url: "ws://h:2/ws", token: "k" };
    expect(
      resolveSessionConfig(
        location,
        undefined,
        storage({ "piximi.session": JSON.stringify(remembered) }),
      ),
    ).toEqual(remembered);
  });

  it("means local when nothing names a session", () => {
    expect(resolveSessionConfig(location, undefined, storage())).toBeNull();
    expect(resolveSessionConfig(location, undefined, null)).toBeNull();
  });
});

describe("exchangeToken", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("posts the token to the backend's session endpoint over HTTP", async () => {
    const fetch = vi.fn(async () => ({
      ok: true,
      status: 200,
      json: async () => ({ ticket: "tkt" }),
    }));
    vi.stubGlobal("fetch", fetch);

    expect(await exchangeToken("wss://h:9/ws", "secret")).toBe("tkt");
    expect(fetch).toHaveBeenCalledWith(
      "https://h:9/session",
      expect.objectContaining({ method: "POST", body: '{"token":"secret"}' }),
    );
  });

  it("reports a rejected token", async () => {
    vi.stubGlobal("fetch", async () => ({ ok: false, status: 403 }));
    await expect(exchangeToken("ws://h:9/ws", "wrong")).rejects.toThrow(
      "rejected the token",
    );
  });
});

describe("resolveBasePath", () => {
  it("is the root unless a serving backend says where the app is mounted", () => {
    expect(resolveBasePath(undefined)).toBe("/");
    expect(resolveBasePath({ url: "/ws" })).toBe("/");
    expect(resolveBasePath({ url: "/p/ws", basePath: "/p/" })).toBe("/p");
    expect(resolveBasePath({ basePath: "user/x/proxy/1" })).toBe(
      "/user/x/proxy/1",
    );
  });

  it("prefixes app paths", () => {
    expect(appPath("/project", "/")).toBe("/project");
    expect(appPath("/project", "/user/x/proxy/1")).toBe(
      "/user/x/proxy/1/project",
    );
  });
});
