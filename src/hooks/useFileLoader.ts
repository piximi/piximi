import { useCallback, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { appTasksSlice } from "store/appTasks/appTasksSlice";
import { AppTask } from "store/appTasks/types";
import { generateUUID } from "store/dataV2/utils";
import { dataSliceV2 } from "store/dataV2/dataSliceV2";
import { selectExperiment } from "store/dataV2/selectors";
import { ImageSeries } from "store/dataV2/types";
import { FileLoader } from "utils/file-io-v2/file-loader";
import {
  FILE,
  TiffAnalysisResult,
  TiffDialogCallbackResult,
  TiffImportConfig,
  UploadOptionswithCallbacks,
} from "utils/file-io-v2/file-loader/types";
import { taskCancelRegistry } from "store/appTasks/taskCancelRegistry";
import { interpretFiles } from "utils/file-io-v2/file-loader/fileInputUtils";
import { prepareTiffConfigs } from "utils/file-io-v2/file-loader/readers/TiffReader";

type UseFileLoaderReturn = {
  upload: (
    files: FileList,
    options?: UploadOptionswithCallbacks,
  ) => Promise<void>;
  isUploading: boolean;
  tiffDialogOpen: boolean;
  pendingTiffAnalysis: TiffAnalysisResult[] | null;

  handleConfirmTiffConfig: (config: TiffDialogCallbackResult) => void;
  handleCancelTiffConfig: () => void;
};

/**
 * Hook that orchestrates the upload pipeline
 *
 * Calls DataPipelineService for worker-based processing,
 * then dispatches the results to Redux
 */
export function useFileLoader(): UseFileLoaderReturn {
  const dispatch = useDispatch();
  const experiment = useSelector(selectExperiment);
  const [isUploading, setIsUploading] = useState(false);
  const [tiffDialogOpen, setTiffDialogOpen] = useState(false);
  const [pendingTiffAnalysis, setPendingTiffAnalysis] = useState<
    TiffAnalysisResult[] | null
  >(null);
  const tiffResolverRef = useRef<
    ((config: TiffDialogCallbackResult | null) => void) | null
  >(null);

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
    async (files: FileList): Promise<void> => {
      setIsUploading(true);
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
      try {
        // 1. Run the pipeline (workers + IndexDB)
        const interpretationResults = interpretFiles(files);
        // TIFF-specific pre-analysis (the only format that needs a dialog)
        let tiffConfigs: Map<string, TiffImportConfig> | undefined;
        let cachedBuffers: Map<string, ArrayBuffer> | undefined;
        if (interpretationResults.imageType === FILE.TIFF) {
          const tiffPrep = await prepareTiffConfigs(
            files,
            (progress: { overallProgress: number }) => {
              dispatch(
                appTasksSlice.actions.taskUpdated({
                  id: taskId,
                  progress: progress.overallProgress,
                }),
              );
            },
            async (
              analysis: TiffAnalysisResult[],
            ): Promise<TiffDialogCallbackResult | null> => {
              return new Promise((resolve) => {
                setPendingTiffAnalysis(analysis);
                tiffResolverRef.current = resolve;
                setTiffDialogOpen(true);
              });
            },
          );
          if (tiffPrep === null) {
            dispatch(appTasksSlice.actions.taskCancelled({ id: taskId }));
            return;
          }
          tiffConfigs = tiffPrep.configs;
          cachedBuffers = tiffPrep.buffers;
        }
        const fileLoader = new FileLoader(
          interpretationResults,
          tiffConfigs,
          cachedBuffers,
          experiment.channels,
        );
        taskCancelRegistry.register(taskId, () => fileLoader.cancel());
        fileLoader.onProgress((progress) => {
          dispatch(
            appTasksSlice.actions.taskUpdated({
              id: taskId,
              progress: progress.overallProgress,
            }),
          );
        });
        const result = await fileLoader.uploadFiles(files);
        if (!result.success) {
          if (result.cancelled) {
            dispatch(appTasksSlice.actions.taskCancelled({ id: taskId }));
          } else {
            dispatch(
              appTasksSlice.actions.taskFailed({
                id: taskId,
                error: result.error.message,
              }),
            );
          }
          return;
        }

        const { imageSeries, images, planes, channels, channelMetas } =
          result.data[0];

        const reduxImageSeries: ImageSeries[] = [];
        imageSeries.forEach((series) => {
          reduxImageSeries.push({ ...series, experimentId: experiment.id });
        });

        if (!experiment.channels)
          dispatch(
            dataSliceV2.actions.setExperimentChannels(images[0].shape.channels),
          );

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

        return;
      } catch (err) {
        dispatch(
          appTasksSlice.actions.taskFailed({
            id: taskId,
            error:
              err instanceof Error ? err.message : "Failed to upload files",
          }),
        );
        return;
      } finally {
        taskCancelRegistry.unregister(taskId);
        setIsUploading(false);
      }
    },
    [dispatch],
  );

  return {
    upload,
    isUploading,
    tiffDialogOpen,
    pendingTiffAnalysis,
    handleConfirmTiffConfig,
    handleCancelTiffConfig,
  };
}
