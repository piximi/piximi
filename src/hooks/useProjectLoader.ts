import { useScheduler } from "contexts/worker-scheduler";
import { useCallback, useState } from "react";
import { batch, useDispatch } from "react-redux";
import { applicationSettingsSlice } from "store/applicationSettings";
import { appTasksSlice } from "store/appTasks/appTasksSlice";
import { AppTask } from "store/appTasks/types";
import { classifierSlice } from "store/classifier";
import { generateUUID } from "store/dataV2/utils";
import { dataSliceV2 } from "store/dataV2/dataSliceV2";
import { projectSlice } from "@ProjectViewer/state";
import { segmenterSlice } from "store/segmenter";
import { AlertType } from "utils/enums";
import { ProjectLoader } from "utils/file-io-v2/project-loader/ProjectLoader";
import { AlertState } from "utils/types";

type UseProjectLoaderReturn = {
  loadExample: (examplePath: string, projectName: string) => Promise<void>;
  loadProject: (files: FileList) => Promise<void>;
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
    async (files: FileList): Promise<void> => {
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
            const warning: AlertState = {
              alertType: AlertType.Warning,
              name: "Could not parse project file",
              description: `Error while parsing the project file: ${result.error.name}\n${result.error.message}`,
            };

            dispatch(
              applicationSettingsSlice.actions.updateAlertState({
                alertState: warning,
              }),
            );
          }
          return;
        }
        const { data, classifier, segmenter } = result.project;

        batch(() => {
          dispatch(projectSlice.actions.resetProject());
          dispatch(
            classifierSlice.actions.setClassifier({
              classifier: classifier,
            }),
          );
          dispatch(dataSliceV2.actions.setState(data));
          dispatch(
            segmenterSlice.actions.setSegmenter({
              segmenter: segmenter,
            }),
          );
        });

        dispatch(appTasksSlice.actions.taskCompleted({ id: taskId }));
      } finally {
        setIsLoading(false);
      }
    },
    [dispatch, scheduler],
  );
  const loadExample = useCallback(
    async (examplePath: string, projectName: string): Promise<void> => {
      setIsLoading(true);
      try {
        const exampleProjectFileList = await fetch(examplePath)
          .then((res) => res.blob())
          .then((blob) => [new File([blob], projectName, blob)])
          .catch((err: any) => {
            import.meta.env.PROD &&
              import.meta.env.VITE_APP_LOG_LEVEL === "1" &&
              console.error(err);
            throw err;
          });
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
        const result = await projectLoader.uploadProject(
          exampleProjectFileList,
        );
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
            const warning: AlertState = {
              alertType: AlertType.Warning,
              name: "Could not parse project file",
              description: `Error while parsing the project file: ${result.error.name}\n${result.error.message}`,
            };

            dispatch(
              applicationSettingsSlice.actions.updateAlertState({
                alertState: warning,
              }),
            );
          }
          return;
        }
        const { data, classifier, segmenter } = result.project;

        batch(() => {
          dispatch(projectSlice.actions.resetProject());
          dispatch(
            classifierSlice.actions.setClassifier({
              classifier: classifier,
            }),
          );
          dispatch(dataSliceV2.actions.setState(data));
          dispatch(
            segmenterSlice.actions.setSegmenter({
              segmenter: segmenter,
            }),
          );
        });

        dispatch(appTasksSlice.actions.taskCompleted({ id: taskId }));
      } finally {
        setIsLoading(false);
      }
    },
    [dispatch, scheduler],
  );

  return {
    loadExample,
    loadProject,
    isLoading,
  };
}
