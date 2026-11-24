import { backendSyncSlice } from "store/backendSync";

import { logger } from "utils/logUtils";

import { LocalBackend } from "./local/LocalBackend";
import { RemoteBackend } from "./remote/RemoteBackend";
import { connectBackendToStore } from "./sync/connectBackendToStore";
import { hydrateStoreFromBackend } from "./sync/hydrateStoreFromBackend";

import type { StoreHandle } from "./local/store";
import type { Backend } from "./types";

/* Where a remote session is, and the launch token that opens it. */
export type SessionConfig = { url: string; token?: string };

declare global {
  interface Window {
    /* Injected into index.html by a server that serves the frontend itself. */
    __PIXIMI_BACKEND__?: { url?: string; basePath?: string };
  }
}

/*
 * What this tab chose, kept across its reloads: the session it joined, or to
 * work locally even on a page a serving backend would otherwise connect.
 */
const STORAGE_KEY = "piximi.session";
type Remembered = SessionConfig | { local: true };

const sessionStorageOrNull = (): Storage | null => {
  try {
    return window.sessionStorage;
  } catch {
    return null;
  }
};

const absoluteWebSocketUrl = (
  url: string,
  location: Pick<Location, "protocol" | "host">,
): string =>
  url.startsWith("/")
    ? `${location.protocol === "https:" ? "wss:" : "ws:"}//${location.host}${url}`
    : url;

/*
 * Where the app is mounted: a serving backend behind a path-prefixing proxy
 * injects it; otherwise the root. Normalized to have no trailing slash
 * except for the root itself.
 */
export const resolveBasePath = (
  injected: Window["__PIXIMI_BACKEND__"] = window.__PIXIMI_BACKEND__,
): string => {
  const base = injected?.basePath?.replace(/\/+$/, "") ?? "";
  return base === "" ? "/" : base.startsWith("/") ? base : `/${base}`;
};

/* A path within the app, e.g. `/project`, as the browser must see it. */
export const appPath = (path: string, basePath = resolveBasePath()): string =>
  basePath === "/" ? path : `${basePath}${path}`;

/*
 * The session this page should join: its URL from `?backend=`, else the
 * config a serving backend injected, else what this tab remembered; and its
 * token from `?token=`, else the remembered one when it belongs to that same
 * URL. `null` means run locally, as it does once the tab has chosen to,
 * unless the URL itself asks to join.
 */
export const resolveSessionConfig = (
  location: Pick<Location, "search" | "protocol" | "host"> = window.location,
  injected: Window["__PIXIMI_BACKEND__"] = window.__PIXIMI_BACKEND__,
  storage: Storage | null = sessionStorageOrNull(),
): SessionConfig | null => {
  const params = new URLSearchParams(location.search);
  let stored: Remembered | null = null;
  try {
    const item = storage?.getItem(STORAGE_KEY);
    stored = item ? (JSON.parse(item) as Remembered) : null;
  } catch {
    stored = null;
  }
  const askedToJoin = params.has("backend") || params.has("token");
  if (stored && "local" in stored && !askedToJoin) return null;
  const remembered = stored && "url" in stored ? stored : null;

  const fromUrl = params.get("backend");
  const url = fromUrl
    ? absoluteWebSocketUrl(fromUrl, location)
    : injected?.url
      ? absoluteWebSocketUrl(injected.url, location)
      : remembered?.url;
  if (!url) return null;

  const token =
    params.get("token") ??
    (remembered?.url === url ? remembered.token : undefined);
  return { url, token };
};

/* Keeps the session for reloads of this tab; the URL loses the token. */
export const rememberSession = (config: SessionConfig): void => {
  try {
    sessionStorageOrNull()?.setItem(STORAGE_KEY, JSON.stringify(config));
  } catch {
    // Nothing to do: the next reload will need the URL again.
  }
};

/* Keeps this tab local across reloads, even where a backend serves the page. */
export const chooseLocal = (): void => {
  try {
    sessionStorageOrNull()?.setItem(
      STORAGE_KEY,
      JSON.stringify({ local: true } satisfies Remembered),
    );
  } catch {
    // Nothing to do: a served page will connect again on reload.
  }
};

/*
 * What a person pastes to connect: the `Backend: ws://host:port/ws` line
 * `piximi serve` prints, its `Open: http://host:port/?token=…` line (the page
 * URL becomes the socket next to it, token included), or just `host:port`.
 */
export const parseBackendAddress = (input: string): SessionConfig => {
  const text = input.trim();
  if (!text) throw new Error("Enter the backend address");
  const withScheme = /^[a-z][a-z0-9+.-]*:\/\//i.test(text)
    ? text
    : `ws://${text}`;
  let url: URL;
  try {
    url = new URL(withScheme);
  } catch {
    throw new Error("Not a valid address");
  }
  const token = url.searchParams.get("token") ?? undefined;
  switch (url.protocol) {
    case "ws:":
    case "wss:":
      break;
    case "http:":
      url.protocol = "ws:";
      break;
    case "https:":
      url.protocol = "wss:";
      break;
    default:
      throw new Error(
        "The address must start with ws://, wss://, http:// or https://",
      );
  }
  if (!url.hostname) throw new Error("The address has no host");
  const path = url.pathname.replace(/\/index\.html$/, "").replace(/\/+$/, "");
  url.pathname = path.endsWith("/ws") ? path : `${path}/ws`;
  url.search = "";
  url.hash = "";
  return { url: url.toString(), token };
};

/* The page that joins `config`: a full navigation, so the boot connects. */
export const sessionLink = (config: SessionConfig): string => {
  const params = new URLSearchParams({ backend: config.url });
  if (config.token) params.set("token", config.token);
  return `${appPath("/project")}?${params.toString()}`;
};

/* Leaves the remote session for a fresh local start. */
export const leaveSession = (): void => {
  chooseLocal();
  window.location.assign(appPath("/"));
};

/* Drops `backend` and `token` from the address bar once they have been used. */
export const stripSessionParams = (): void => {
  const url = new URL(window.location.href);
  if (!url.searchParams.has("backend") && !url.searchParams.has("token"))
    return;
  url.searchParams.delete("backend");
  url.searchParams.delete("token");
  window.history.replaceState(window.history.state, "", url.toString());
};

const sessionEndpoint = (wsUrl: string): string => {
  const http = new URL(wsUrl);
  http.protocol = http.protocol === "wss:" ? "https:" : "http:";
  http.pathname = `${http.pathname.replace(/\/ws\/?$/, "")}/session`;
  http.search = "";
  return http.toString();
};

/* Trades the launch token for a single-use ticket over HTTP. */
export const exchangeToken = async (
  wsUrl: string,
  token: string,
): Promise<string> => {
  const response = await fetch(sessionEndpoint(wsUrl), {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ token }),
  });
  if (!response.ok) {
    throw new Error(
      response.status === 403
        ? "The backend rejected the token"
        : `The backend answered ${response.status} to the session request`,
    );
  }
  const { ticket } = (await response.json()) as { ticket: string };
  return ticket;
};

/* Joins a remote session and fills the store from it. Rejects on failure. */
export const installRemoteBackend = async (
  store: StoreHandle,
  config: SessionConfig,
): Promise<Backend> => {
  const ticket =
    config.token !== undefined
      ? await exchangeToken(config.url, config.token)
      : undefined;
  const backend = await RemoteBackend.connect(config.url, { ticket });
  // The engine decides when its answers change; the mirror filling does not.
  store.dispatch(backendSyncSlice.actions.setRevisionSource("backend"));
  connectBackendToStore(backend, store);
  const { mirrored } = await hydrateStoreFromBackend(backend, store.dispatch);
  // The rest of the images keep streaming in behind the first screen.
  mirrored.catch((error: unknown) => console.error(error));
  logger(`Connected to backend ${config.url} (session ${backend.session.id})`);
  return backend;
};

export const installLocalBackend = async (
  store: StoreHandle,
): Promise<Backend> => {
  const backend = new LocalBackend({ store });
  store.dispatch(backendSyncSlice.actions.setRevisionSource("store"));
  connectBackendToStore(backend, store);
  await backend.connect();
  return backend;
};
