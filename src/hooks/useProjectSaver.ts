import { useCallback, useState } from "react";

import { useDispatch } from "react-redux";

import { saveAs } from "file-saver";

import { useBackend } from "core/backend";
import { generateUUID } from "core/entities";
import { isTaskCancelledError } from "core/dl/cancel";

import { applicationSettingsSlice } from "store/applicationSettings";
import { appTasksSlice } from "store/appTasks/appTasksSlice";
import { taskCancelRegistry } from "store/appTasks/taskCancelRegistry";

import { AlertType } from "utils/enums";

import type { AppTask } from "store/appTasks/types";

import type { AlertState } from "utils/types";

type UseProjectSaverReturn = {
  saveProject: (name: string) => Promise<void>;
  isSaving: boolean;
};

/*
 * Downloads the open project as a `.piximi` file. The backend writes it
 * (the browser's own workers, or the engine), reporting progress into a
 * cancellable task; the hook saves what comes back.
 */
export const useProjectSaver = (): UseProjectSaverReturn => {
  const dispatch = useDispatch();
  const backend = useBackend();
  const [isSaving, setIsSaving] = useState(false);

  const saveProject = useCallback(
    async (name: string): Promise<void> => {
      setIsSaving(true);
      const taskId = generateUUID();
      const task: AppTask = {
        id: taskId,
        type: "project-download",
        status: "running",
        progress: 0,
        label: "Saving Project",
        cancellable: true,
        startedAt: Date.now(),
      };
      dispatch(appTasksSlice.actions.taskRegistered(task));
      const controller = new AbortController();
      taskCancelRegistry.register(taskId, () => controller.abort());
      try {
        const file = await backend.project.export(name, {
          signal: controller.signal,
          onProgress: ({ percent }) =>
            dispatch(
              appTasksSlice.actions.taskUpdated({
                id: taskId,
                progress: Math.round(percent),
              }),
            ),
        });
        saveAs(
          new Blob([file.data.slice()], { type: file.mime }),
          file.fileName,
        );
        dispatch(appTasksSlice.actions.taskCompleted({ id: taskId }));
      } catch (err) {
        if (controller.signal.aborted || isTaskCancelledError(err)) {
          dispatch(appTasksSlice.actions.taskCancelled({ id: taskId }));
          return;
        }
        const message = err instanceof Error ? err.message : String(err);
        dispatch(
          appTasksSlice.actions.taskFailed({
            id: taskId,
            error: `Error while saving the project: ${message}`,
          }),
        );
        const warning: AlertState = {
          alertType: AlertType.Warning,
          name: "Could not save project",
          description: `Error while saving the project: ${message}`,
        };
        dispatch(
          applicationSettingsSlice.actions.updateAlertState({
            alertState: warning,
          }),
        );
      } finally {
        taskCancelRegistry.unregister(taskId);
        setIsSaving(false);
      }
    },
    [backend, dispatch],
  );

  return { saveProject, isSaving };
};
