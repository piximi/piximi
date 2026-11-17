import { applicationSettingsSlice } from "store/applicationSettings";

import { AlertType } from "utils/enums";
import { logger } from "utils/logUtils";

import { LocalBackend } from "./local/LocalBackend";
import { RemoteBackend } from "./remote/RemoteBackend";
import { connectBackendToStore } from "./sync/connectBackendToStore";
import { hydrateStoreFromBackend } from "./sync/hydrateStoreFromBackend";

import type { StoreHandle } from "./local/store";
import type { Backend } from "./types";

/* `?backend=ws://host:port/ws` selects a remote session for this page load. */
const backendUrlFromLocation = (
  location: Pick<Location, "search">,
): string | null => new URLSearchParams(location.search).get("backend");

/*
 * Picks the backend for this session and wires its events into the store.
 * A remote backend also fills the store with the project it holds. Failing
 * to reach it falls back to the local backend, loudly: the alert says so.
 */
export const installBackend = async (
  store: StoreHandle,
  url: string | null = backendUrlFromLocation(window.location),
): Promise<Backend> => {
  if (url) {
    try {
      const backend = await RemoteBackend.connect(url);
      connectBackendToStore(backend, store);
      await hydrateStoreFromBackend(backend, store.dispatch);
      logger(`Connected to backend ${url} (session ${backend.session.id})`);
      return backend;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      store.dispatch(
        applicationSettingsSlice.actions.updateAlertState({
          alertState: {
            alertType: AlertType.Error,
            name: "Could not connect to the backend",
            description: `${url}: ${message}. Running with the local backend instead.`,
          },
        }),
      );
    }
  }
  const backend = new LocalBackend({ store });
  connectBackendToStore(backend, store);
  await backend.connect();
  return backend;
};
