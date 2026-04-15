import { useContext } from "react";
import { WorkerScheduler } from "utils/worker-scheduler";
import { SchedulerContext } from "./SchedulerContext";

export const useScheduler = (): WorkerScheduler => {
  const context = useContext(SchedulerContext);
  if (!context) {
    throw new Error("useScheduler must be used within SchedulerProvider");
  }
  return context.scheduler;
};
