import { createContext, useContext } from "react";

import type { ReactNode } from "react";

import type { Backend } from "./types";

const BackendContext = createContext<Backend | null>(null);

export const BackendProvider = ({
  backend,
  children,
}: {
  backend: Backend;
  children: ReactNode;
}) => (
  <BackendContext.Provider value={backend}>{children}</BackendContext.Provider>
);

export const useBackend = (): Backend => {
  const backend = useContext(BackendContext);
  if (!backend) {
    throw new Error("useBackend must be used within a BackendProvider");
  }
  return backend;
};
