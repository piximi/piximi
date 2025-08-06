import { createContext, useContext, useEffect, useRef } from "react";
import * as Comlink from "comlink";

const WorkerContext = createContext<null | {
  workerRef: React.MutableRefObject<Comlink.Remote<unknown> | undefined>;
}>(null);

export const WorkerProvider = ({ children }: { children: React.ReactNode }) => {
  const workerRef = useRef<Comlink.Remote<unknown>>();
  useEffect(() => {
    const globalWorker = new SharedWorker(
      new URL("../utils/web-workers/worker.js", import.meta.url),
    );

    const obj = Comlink.wrap(globalWorker.port);
    workerRef.current = obj;
  }, []);

  return (
    <WorkerContext.Provider value={{ workerRef }}>
      {children}
    </WorkerContext.Provider>
  );
};

export const useWorker = () => useContext(WorkerContext);
