import { LocalBackend } from "./local/LocalBackend";
import { connectBackendToStore } from "./sync/connectBackendToStore";

import type { StoreHandle } from "./local/store";
import type { Backend } from "./types";

/*
 * Picks the backend for this session and wires its events into the store.
 * Only the local one exists so far; remote selection (a `?backend=` URL or a
 * same-origin injected config) plugs in here.
 */
export const installBackend = (store: StoreHandle): Backend => {
  const backend = new LocalBackend({ store });
  connectBackendToStore(backend, store);
  return backend;
};
