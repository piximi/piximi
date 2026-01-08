// src/contexts/SchedulerProvider.tsx
import React, {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";

import { WorkerScheduler, AggregateProgress } from "../workers/scheduler";

interface SchedulerContextValue {
  scheduler: WorkerScheduler;
  progress: AggregateProgress;
}

const SchedulerContext = createContext<SchedulerContextValue | null>(null);

const initialProgress: AggregateProgress = {
  pending: 0,
  running: 0,
  completed: 0,
  failed: 0,
  overallPercent: 0,
};

export const SchedulerProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const schedulerRef = useRef<WorkerScheduler>();
  const [progress, setProgress] = useState<AggregateProgress>(initialProgress);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const scheduler = new WorkerScheduler();
    schedulerRef.current = scheduler;

    // Subscribe to aggregate progress
    const unsubscribe = scheduler.onProgress(setProgress);

    setIsReady(true);

    return () => {
      unsubscribe();
      scheduler.shutdown();
    };
  }, []);

  if (!isReady || !schedulerRef.current) return null;

  return (
    <SchedulerContext.Provider
      value={{ scheduler: schedulerRef.current, progress }}
    >
      {children}
    </SchedulerContext.Provider>
  );
};

// Hooks
export const useScheduler = (): WorkerScheduler => {
  const context = useContext(SchedulerContext);
  if (!context) {
    throw new Error("useScheduler must be used within SchedulerProvider");
  }
  return context.scheduler;
};

export const useSchedulerProgress = (): AggregateProgress => {
  const context = useContext(SchedulerContext);
  if (!context) {
    throw new Error(
      "useSchedulerProgress must be used within SchedulerProvider",
    );
  }
  return context.progress;
};
