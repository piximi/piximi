import { useScheduler } from "contexts/worker-scheduler";
import { useCallback, useState } from "react";
import { batch, useDispatch } from "react-redux";
import { applicationSettingsSlice } from "store/applicationSettings";
import { appTasksSlice } from "store/appTasks/appTasksSlice";
import { AppTask } from "store/appTasks/types";
import { classifierSlice } from "store/classifier";
import { generateUUID } from "store/data/utils";
import { dataSlice } from "store/data";
import { projectSlice } from "@ProjectViewer/state";
import { AlertType } from "utils/enums";
import { ProjectLoader } from "utils/file-io/project-loader/ProjectLoader";
import { AlertState } from "utils/types";
import { taskCancelRegistry } from "store/appTasks/taskCancelRegistry";
import { clearCache } from "utils/renderedSrcsCache";

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
      const taskId = generateUUID();
      const newTask: AppTask = {
        id: taskId,
        type: "project-load",
        status: "running",
        progress: -1,
        label: "Loading Project",
        cancellable: true,
        startedAt: Date.now(),
      };
      dispatch(appTasksSlice.actions.taskRegistered(newTask));

      if (
        files.length > 1 &&
        files[0].webkitRelativePath.split("/")[0].split(".").at(-1) !== "zarr"
      ) {
        dispatch(
          appTasksSlice.actions.taskFailed({
            id: taskId,
            error: "Uploaded folder must be .zarr",
          }),
        );
        return;
      }

      let projectLoader: ProjectLoader;
      try {
        projectLoader = new ProjectLoader(scheduler);
        taskCancelRegistry.register(taskId, () => projectLoader.cancel());
      } catch (err) {
        dispatch(
          appTasksSlice.actions.taskFailed({
            id: taskId,
            error:
              err instanceof Error
                ? err.message
                : "Failed to initialize loader",
          }),
        );
        return;
      }

      try {
        // 1. Run the pipeline (workers + IndexDB)
        projectLoader.onProgress((progress) => {
          dispatch(
            appTasksSlice.actions.taskUpdated({
              id: taskId,
              progress: Math.round(progress.overallProgress * 100),
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
                error: `Error while parsing the project file: ${result.error.name}\n${result.error.message}`,
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
        const { data, classifier } = result.project;
        clearCache();
        batch(() => {
          dispatch(projectSlice.actions.resetProject());
          dispatch(
            classifierSlice.actions.setClassifier({
              classifier: classifier,
            }),
          );
          dispatch(dataSlice.actions.setState(data));
        });

        dispatch(appTasksSlice.actions.taskCompleted({ id: taskId }));
      } catch (err) {
        dispatch(
          appTasksSlice.actions.taskFailed({
            id: taskId,
            error:
              err instanceof Error ? err.message : "Failed to load project",
          }),
        );
        throw err;
      } finally {
        taskCancelRegistry.unregister(taskId);
        setIsLoading(false);
      }
    },
    [dispatch, scheduler],
  );
  const loadExample = useCallback(
    async (examplePath: string, projectName: string): Promise<void> => {
      setIsLoading(true);
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
      let projectLoader: ProjectLoader;
      try {
        projectLoader = new ProjectLoader(scheduler);
        taskCancelRegistry.register(taskId, () => projectLoader.cancel());
      } catch (err) {
        dispatch(
          appTasksSlice.actions.taskFailed({
            id: taskId,
            error:
              err instanceof Error
                ? err.message
                : "Failed to initialize loader",
          }),
        );
        return;
      }
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

        projectLoader = new ProjectLoader(scheduler);
        taskCancelRegistry.register(taskId, () => projectLoader.cancel());
        projectLoader.onProgress((progress) => {
          dispatch(
            appTasksSlice.actions.taskUpdated({
              id: taskId,
              progress: Math.round(progress.overallProgress * 100),
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
                error: `Error while parsing the project file: ${result.error.name}\n${result.error.message}`,
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
        const { data, classifier } = result.project;

        clearCache();
        batch(() => {
          dispatch(projectSlice.actions.resetProject());
          dispatch(
            classifierSlice.actions.setClassifier({
              classifier: classifier,
            }),
          );
          dispatch(dataSlice.actions.setState(data));
        });

        dispatch(appTasksSlice.actions.taskCompleted({ id: taskId }));
      } catch (err) {
        dispatch(
          appTasksSlice.actions.taskFailed({
            id: taskId,
            error:
              err instanceof Error ? err.message : "Failed to load project",
          }),
        );
        throw err;
      } finally {
        taskCancelRegistry.unregister(taskId);
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
