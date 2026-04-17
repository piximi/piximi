import { useScheduler } from "contexts/worker-scheduler";
import { useCallback, useState } from "react";
import { batch, useDispatch } from "react-redux";
import { appTasksSlice } from "store/appTasks/appTasksSlice";
import { AppTask } from "store/appTasks/types";
import { classifierSlice } from "store/classifier";
import { generateUUID } from "store/data/utils";
import { dataSliceV2 } from "store/dataV2/dataSliceV2";
import { projectSlice } from "store/project";
import { segmenterSlice } from "store/segmenter";
import { ProjectLoader } from "utils/file-io-v2/project-loader/ProjectLoader";
import { DeserializedProjectResult } from "utils/file-io-v2/project-loader/types";

type UseProjectLoaderReturn = {
  loadProject: (files: FileList) => Promise<DeserializedProjectResult>;
  isLoading: boolean;
};

/**
 * Hook that orchestrates the upload pipeline
 *
 * Calls DataPipelineService for worker-based processing,
 * then dispatches the results to Redux
 */
export function useProjectLoader(): UseProjectLoaderReturn {
  const dispatch = useDispatch();
  const scheduler = useScheduler();
  const [isLoading, setIsLoading] = useState(false);

  const loadProject = useCallback(
    async (files: FileList): Promise<DeserializedProjectResult> => {
      setIsLoading(true);
      try {
        // 1. Run the pipeline (workers + IndexDB)
        const taskId = generateUUID();
        const newTask: AppTask = {
          id: taskId,
          type: "project-load",
          status: "running",
          progress: 0,
          label: "Loading Project",
          startedAt: Date.now(),
        };
        dispatch(appTasksSlice.actions.taskRegistered(newTask));
        const projectLoader = new ProjectLoader(scheduler);
        projectLoader.onProgress((progress) => {
          dispatch(
            appTasksSlice.actions.taskUpdated({
              id: taskId,
              progress: progress.overallProgress,
            }),
          );
        });
        const result = await projectLoader.uploadProject([...files]);
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
          return result;
        }
        const { project, data, classifier, segmenter } = result.project;

        batch(() => {
          dispatch(projectSlice.actions.resetProject());
          dispatch(
            projectSlice.actions.setProject({
              project: project,
            }),
          );
          dispatch(dataSliceV2.actions.setState(data));
          dispatch(
            classifierSlice.actions.setClassifier({
              classifier: classifier,
            }),
          );
          dispatch(
            segmenterSlice.actions.setSegmenter({
              segmenter: segmenter,
            }),
          );
        });

        dispatch(appTasksSlice.actions.taskCompleted({ id: taskId }));

        return result;
      } finally {
        setIsLoading(false);
      }
    },
    [dispatch, scheduler],
  );

  return {
    loadProject,
    isLoading,
  };
}
