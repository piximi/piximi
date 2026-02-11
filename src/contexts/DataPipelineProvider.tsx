import React, {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  ReactNode,
} from "react";

import { DataPipelineService, PipelineProgress } from "services/dataPipeline";
import { useScheduler } from "./SchedulerProvider";

// ============================================================
// Context Types
// ============================================================

type DataPipelineContextValue = {
  pipeline: DataPipelineService;
  progress: PipelineProgress;
  isProcessing: boolean;
};

const DataPipelineContext = createContext<DataPipelineContextValue | null>(
  null,
);

// ============================================================
// Provider Component
// ============================================================

type DataPipelineProviderProps = {
  children: ReactNode;
};

export const DataPipelineProvider: React.FC<DataPipelineProviderProps> = ({
  children,
}) => {
  const scheduler = useScheduler();
  const pipelineRef = useRef<DataPipelineService>();
  const [progress, setProgress] = useState<PipelineProgress>({
    stage: "idle",
    stageProgress: 0,
    overallProgress: 0,
    processedCount: 0,
    totalCount: 0,
    errors: [],
    warnings: [],
  });

  useEffect(() => {
    const pipeline = DataPipelineService.getInstance(scheduler);
    pipelineRef.current = pipeline;

    // Subscribe to progress updates
    const unsubscribe = pipeline.onProgress(setProgress);

    return () => {
      unsubscribe();
    };
  }, [scheduler]);

  const isProcessing =
    progress.stage !== "idle" &&
    progress.stage !== "complete" &&
    progress.stage !== "error" &&
    progress.stage !== "cancelled";

  const value: DataPipelineContextValue = {
    pipeline: pipelineRef.current!,
    progress,
    isProcessing,
  };

  if (!pipelineRef.current) {
    return null;
  }

  return (
    <DataPipelineContext.Provider value={value}>
      {children}
    </DataPipelineContext.Provider>
  );
};

// ============================================================
// Hooks
// ============================================================

/**
 * Get the DataPipelineService instance
 */
export const useDataPipeline = (): DataPipelineService => {
  const context = useContext(DataPipelineContext);
  if (!context) {
    throw new Error("useDataPipeline must be used within DataPipelineProvider");
  }
  return context.pipeline;
};

/**
 * Get current pipeline progress
 */
export const usePipelineProgress = (): PipelineProgress => {
  const context = useContext(DataPipelineContext);
  if (!context) {
    throw new Error(
      "usePipelineProgress must be used within DataPipelineProvider",
    );
  }
  return context.progress;
};

/**
 * Check if pipeline is currently processing
 */
export const useIsPipelineProcessing = (): boolean => {
  const context = useContext(DataPipelineContext);
  if (!context) {
    throw new Error(
      "useIsPipelineProcessing must be used within DataPipelineProvider",
    );
  }
  return context.isProcessing;
};
