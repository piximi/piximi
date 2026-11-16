import { LocalBackend } from "./local/LocalBackend";

import type { StoreHandle } from "./local/LocalBackend";
import type { Backend } from "./types";

/*
 * Picks the backend for this session. Only the local one exists so far;
 * remote selection (a `?backend=` URL or a same-origin injected config) plugs
 * in here.
 */
export const installBackend = (store: StoreHandle): Backend =>
  new LocalBackend({ store });
