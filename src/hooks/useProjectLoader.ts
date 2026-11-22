import { useCallback, useState } from "react";

import { useDispatch } from "react-redux";

import JSZip from "jszip";

import { useBackend } from "core/backend";
import { generateUUID } from "core/entities";
import { isTaskCancelledError } from "core/dl/cancel";
import { ProjectLoader } from "core/file-io/project-loader/ProjectLoader";
import { isCurrentProjectArchive } from "core/file-io/project-loader/upgradeProject";

import { applicationSettingsSlice } from "store/applicationSettings";
import { appTasksSlice } from "store/appTasks/appTasksSlice";
import { taskCancelRegistry } from "store/appTasks/taskCancelRegistry";

import { AlertType } from "utils/enums";

import type { AppTask } from "store/appTasks/types";

import type { AlertState } from "utils/types";

type UseProjectLoaderReturn = {
  loadExample: (examplePath: string, projectName: string) => Promise<void>;
  loadProject: (files: FileList | File[]) => Promise<void>;
  isLoading: boolean;
};

/*
 * A `.zarr` folder picked with `webkitdirectory` arrives as its files; the
 * backend takes one archive, so they are zipped here (stored, not deflated:
 * pixel arrays barely compress and the backend reads it at once).
 */
const archiveFolder = async (files: File[]): Promise<Blob> => {
  const zip = new JSZip();
  for (const file of files) {
    zip.file(file.webkitRelativePath || file.name, file);
  }
  return zip.generateAsync({ type: "blob" });
};

/*
 * Opens a project from a file (or a fetched example) through the backend:
 * the browser's own loader locally, the engine's importer remotely. Either
 * way the backend announces `project/didReset` and the store follows.
 */
export function useProjectLoader(): UseProjectLoaderReturn {
  const dispatch = useDispatch();
  const backend = useBackend();
  const [isLoading, setIsLoading] = useState(false);

  const importProject = useCallback(
    async (data: Blob, name: string | undefined, label: string) => {
      setIsLoading(true);
      const taskId = generateUUID();
      const task: AppTask = {
        id: taskId,
        type: "project-load",
        status: "running",
        progress: -1,
        label,
        cancellable: true,
        startedAt: Date.now(),
      };
      dispatch(appTasksSlice.actions.taskRegistered(task));
      const controller = new AbortController();
      taskCancelRegistry.register(taskId, () => controller.abort());
      try {
        // A remote backend reads only the current layout; the browser's
        // own loader still understands every older one, so an old archive
        // (every bundled example) is rewritten here before it is sent.
        let payload: Blob | Uint8Array = data;
        if (
          backend.kind === "remote" &&
          !(await isCurrentProjectArchive(data))
        ) {
          const loader = new ProjectLoader();
          controller.signal.addEventListener("abort", () => loader.cancel(), {
            once: true,
          });
          loader.onProgress(({ overallProgress }) =>
            dispatch(
              appTasksSlice.actions.taskUpdated({
                id: taskId,
                progress: Math.round(overallProgress * 50),
                label: "Upgrading the project file",
              }),
            ),
          );
          // The loader tells an archive from an unzipped folder by the
          // file's type or extension, so the wrapper must say which it is.
          const upgraded = await loader.upgradeProject([
            new File([data], "project.piximi", { type: "application/zip" }),
          ]);
          payload = upgraded.data;
          name ??= upgraded.name;
          dispatch(
            appTasksSlice.actions.taskUpdated({
              id: taskId,
              progress: 50,
              label,
            }),
          );
        }
        await backend.project.import(payload, name, {
          signal: controller.signal,
          onProgress: ({ percent }) =>
            dispatch(
              appTasksSlice.actions.taskUpdated({
                id: taskId,
                progress: Math.round(
                  payload === data ? percent : 50 + percent / 2,
                ),
              }),
            ),
        });
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
            error: `Error while loading the project: ${message}`,
          }),
        );
        const warning: AlertState = {
          alertType: AlertType.Warning,
          name: "Could not load project",
          description: `Error while loading the project: ${message}`,
        };
        dispatch(
          applicationSettingsSlice.actions.updateAlertState({
            alertState: warning,
          }),
        );
      } finally {
        taskCancelRegistry.unregister(taskId);
        setIsLoading(false);
      }
    },
    [backend, dispatch],
  );

  const loadProject = useCallback(
    async (input: FileList | File[]): Promise<void> => {
      const files = Array.from(input);
      if (files.length === 0) return;
      if (files.length === 1) {
        await importProject(files[0], undefined, "Loading Project");
        return;
      }
      const folder = files[0].webkitRelativePath.split("/")[0];
      if (!folder.endsWith(".zarr")) {
        const warning: AlertState = {
          alertType: AlertType.Warning,
          name: "Could not load project",
          description: "Uploaded folder must be .zarr",
        };
        dispatch(
          applicationSettingsSlice.actions.updateAlertState({
            alertState: warning,
          }),
        );
        return;
      }
      await importProject(
        await archiveFolder(files),
        undefined,
        "Loading Project",
      );
    },
    [dispatch, importProject],
  );

  const loadExample = useCallback(
    async (examplePath: string, projectName: string): Promise<void> => {
      let blob: Blob;
      try {
        blob = await (await fetch(examplePath)).blob();
      } catch (err) {
        const warning: AlertState = {
          alertType: AlertType.Warning,
          name: "Could not fetch the example project",
          description: err instanceof Error ? err.message : String(err),
        };
        dispatch(
          applicationSettingsSlice.actions.updateAlertState({
            alertState: warning,
          }),
        );
        return;
      }
      await importProject(blob, projectName, `Loading ${projectName}`);
    },
    [dispatch, importProject],
  );

  return { loadExample, loadProject, isLoading };
}
