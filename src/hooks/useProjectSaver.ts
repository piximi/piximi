import { useCallback, useState } from "react";

import { useDispatch, useStore } from "react-redux";

import { saveAs } from "file-saver";

import { applicationSettingsSlice } from "store/applicationSettings";
import { appTasksSlice } from "store/appTasks/appTasksSlice";
import type { AppTask } from "store/appTasks/types";
import { taskCancelRegistry } from "store/appTasks/taskCancelRegistry";
import { generateUUID } from "store/data/utils";
import type { RootState } from "store/rootReducer";
import { ProjectSaver } from "core/file-io/project-saver/ProjectSaver";

import { AlertType } from "utils/enums";
import type { AlertState } from "utils/types";

type UseProjectSaverReturn = {
  saveProject: (name: string) => Promise<void>;
  isSaving: boolean;
};

/**
 * Hook that orchestrates the project save pipeline.
 *
 * Mirrors {@link useProjectLoader}: registers a cancellable AppTask, hands the
 * work to ProjectSaver (workers + IndexedDB), and triggers the download.
 */
export const useProjectSaver = (): UseProjectSaverReturn => {
  const dispatch = useDispatch();
  // Read state at click time rather than subscribing — a save needs a snapshot
  // of the whole data slice, and selecting it would re-render on every edit.
  const store = useStore<RootState>();
  const [isSaving, setIsSaving] = useState(false);

  const saveProject = useCallback(
    async (name: string): Promise<void> => {
      setIsSaving(true);
      const taskId = generateUUID();
      const newTask: AppTask = {
        id: taskId,
        type: "project-download",
        status: "running",
        progress: 0,
        label: "Saving Project",
        cancellable: true,
        startedAt: Date.now(),
      };
      dispatch(appTasksSlice.actions.taskRegistered(newTask));

      const projectSaver = new ProjectSaver();
      taskCancelRegistry.register(taskId, () => projectSaver.cancel());

      try {
        projectSaver.onProgress((progress) => {
          dispatch(
            appTasksSlice.actions.taskUpdated({
              id: taskId,
              progress: Math.round(progress.overallProgress * 100),
            }),
          );
        });

        const { data, classifier } = store.getState();
        const result = await projectSaver.saveProject({
          name,
          project: { data, classifier },
        });

        if (!result.success) {
          if (result.cancelled) {
            dispatch(appTasksSlice.actions.taskCancelled({ id: taskId }));
          } else {
            dispatch(
              appTasksSlice.actions.taskFailed({
                id: taskId,
                error: `Error while saving the project: ${result.error.name}\n${result.error.message}`,
              }),
            );
            const warning: AlertState = {
              alertType: AlertType.Warning,
              name: "Could not save project",
              description: `Error while saving the project: ${result.error.name}\n${result.error.message}`,
            };
            dispatch(
              applicationSettingsSlice.actions.updateAlertState({
                alertState: warning,
              }),
            );
          }
          return;
        }

        saveAs(result.blob, `${name}.zip`);
        dispatch(appTasksSlice.actions.taskCompleted({ id: taskId }));
      } catch (err) {
        dispatch(
          appTasksSlice.actions.taskFailed({
            id: taskId,
            error:
              err instanceof Error ? err.message : "Failed to save project",
          }),
        );
        throw err;
      } finally {
        taskCancelRegistry.unregister(taskId);
        setIsSaving(false);
      }
    },
    [dispatch, store],
  );

  return { saveProject, isSaving };
};
