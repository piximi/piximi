import { createContext } from "react";
import { WorkerScheduler } from "utils/worker-scheduler";
import { AggregateProgress } from "utils/worker-scheduler/types";

type SchedulerContextValue = {
  scheduler: WorkerScheduler;
  progress: AggregateProgress;
};

export const SchedulerContext = createContext<SchedulerContextValue | null>(
  null,
);
