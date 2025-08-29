import { createContext, useContext, useEffect, useRef } from "react";
import * as Comlink from "comlink";

const WorkerContext = createContext<null | {
  workerRef: React.MutableRefObject<Comlink.Remote<unknown> | undefined>;
}>(null);

export const WorkerProvider = ({ children }: { children: React.ReactNode }) => {
  const workerRef = useRef<Comlink.Remote<unknown>>();
  useEffect(() => {
    const globalWorker = new SharedWorker(
      new URL(
        "../views/MeasurementView/workers/globalWorker.ts",
        import.meta.url
      ),
      {
        type: "module",
      }
    );
    console.log("launching global");
    // const obj = Comlink.wrap(globalWorker) as any;
    // workerRef.current = obj;

    // workerRef.current = obj;

    globalWorker.port.start();
    const obj = Comlink.wrap(globalWorker.port) as any;
    workerRef.current = obj;
  }, []);

  return (
    <WorkerContext.Provider value={{ workerRef }}>
      {children}
    </WorkerContext.Provider>
  );
};

export const useWorker = () => {
  const workerRef = useContext(WorkerContext);
  return workerRef;
};
