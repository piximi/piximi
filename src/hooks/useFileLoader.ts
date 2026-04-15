import { useScheduler } from "contexts/worker-scheduler";
import { useCallback, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { appTasksSlice } from "store/appTasks/appTasksSlice";
import { AppTask } from "store/appTasks/types";
import { generateUUID } from "store/data/utils";
import { dataSliceV2 } from "store/dataV2/dataSliceV2";
import { selectExperiment } from "store/dataV2/selectors";
import { ImageSeries } from "store/dataV2/types";
import { FileLoader } from "utils/file-io-v2/file-loader";
import {
  FileUploadResult,
  TiffAnalysisResult,
  TiffDialogCallbackResult,
  UploadOptionswithCallbacks,
} from "utils/file-io-v2/file-loader/types";

type UseUploadPipelineReturn = {
  upload: (
    files: FileList,
    options?: UploadOptionswithCallbacks,
  ) => Promise<FileUploadResult>;
  isUploading: boolean;
  tiffDialogOpen: boolean;
  pendingTiffAnalysis: TiffAnalysisResult[] | null;
  handleTiffDialog: (
    analysis: TiffAnalysisResult[],
  ) => Promise<TiffDialogCallbackResult | null>;
  handleConfirmTiffConfig: (config: TiffDialogCallbackResult) => void;
  handleCancelTiffConfig: () => void;
};

/**
 * Hook that orchestrates the upload pipeline
 *
 * Calls DataPipelineService for worker-based processing,
 * then dispatches the results to Redux
 */
export function useFileLoader(): UseUploadPipelineReturn {
  const dispatch = useDispatch();
  const scheduler = useScheduler();
  const experiment = useSelector(selectExperiment);
  const [isUploading, setIsUploading] = useState(false);
  const [tiffDialogOpen, setTiffDialogOpen] = useState(false);
  const [pendingTiffAnalysis, setPendingTiffAnalysis] = useState<
    TiffAnalysisResult[] | null
  >(null);
  const tiffResolverRef = useRef<
    ((config: TiffDialogCallbackResult | null) => void) | null
  >(null);

  const handleTiffDialog = useCallback(
    async (
      analysis: TiffAnalysisResult[],
    ): Promise<TiffDialogCallbackResult | null> => {
      return new Promise((resolve) => {
        setPendingTiffAnalysis(analysis);
        tiffResolverRef.current = resolve;
        setTiffDialogOpen(true);
      });
    },
    [],
  );
  const handleConfirmTiffConfig = useCallback(
    (config: TiffDialogCallbackResult) => {
      tiffResolverRef.current?.(config);
      setTiffDialogOpen(false);
      setPendingTiffAnalysis(null);
    },
    [],
  );
  const handleCancelTiffConfig = useCallback(() => {
    tiffResolverRef.current?.(null);
    setTiffDialogOpen(false);
    setPendingTiffAnalysis(null);
  }, []);
  const upload = useCallback(
    async (
      files: FileList,
      options?: UploadOptionswithCallbacks,
    ): Promise<FileUploadResult> => {
      setIsUploading(true);
      try {
        // 1. Run the pipeline (workers + IndexDB)
        const taskId = generateUUID();
        const newTask: AppTask = {
          id: taskId,
          type: "file-upload",
          status: "running",
          progress: 0,
          label: "Uploading Files",
          startedAt: Date.now(),
        };
        dispatch(appTasksSlice.actions.taskRegistered(newTask));
        const fileLoader = new FileLoader(scheduler);
        fileLoader.onProgress((progress) => {
          dispatch(
            appTasksSlice.actions.taskUpdated({
              id: taskId,
              progress: progress.overallProgress,
            }),
          );
        });
        const result = await fileLoader.uploadFiles(files, options);
        if (!result.success) {
          if (result.cancelled) {
            dispatch(appTasksSlice.actions.taskCancelled({ id: taskId }));
          } else {
            dispatch(
              appTasksSlice.actions.taskFailed({
                id: taskId,
                error: "Failed to upload files",
              }),
            );
          }
          return result;
        }

        const { imageSeries, images, planes, channels, channelMetas } =
          result.data[0];

        const reduxImageSeries: ImageSeries[] = [];
        imageSeries.forEach((series) => {
          reduxImageSeries.push({ ...series, experimentId: experiment.id });
        });

        dispatch(
          dataSliceV2.actions.addImageSeries({
            imageSeries: reduxImageSeries,
            images,
            planes,
            channels,
            channelMetas,
          }),
        );
        dispatch(appTasksSlice.actions.taskCompleted({ id: taskId }));

        return result;
      } finally {
        setIsUploading(false);
      }
    },
    [dispatch, scheduler],
  );

  return {
    upload,
    isUploading,
    tiffDialogOpen,
    pendingTiffAnalysis,
    handleTiffDialog,
    handleConfirmTiffConfig,
    handleCancelTiffConfig,
  };
}
