import { useCallback, useState } from "react";

import { useDispatch, useStore } from "react-redux";

import { saveAs } from "file-saver";

import { generateUUID } from "core/entities";
import { getClassifierApi } from "core/dl/classification";
import { buildClassifiersBundle } from "core/file-io/export/exportFittedModel";

import { appTasksSlice } from "store/appTasks/appTasksSlice";

import { pluralize } from "utils/stringUtils";

import type { Run } from "core/dl/classification/types";

import type { AppTask } from "store/appTasks/types";
import type { RootState } from "store/rootReducer";

type UseClassifiersSaverReturn = {
  saveClassifiers: () => Promise<void>;
  isSaving: boolean;
};

/**
 * Download every created classifier as one archive of per-model zips.
 *
 * Built for {@link FallbackDialog}: it runs after a crash, so each model is
 * fetched on its own and a failure skips that model instead of aborting the
 * export. That mirrors how `ProjectSaver.collectModels` treats models whose
 * weights can't be retrieved.
 */
export const useClassifiersSaver = (): UseClassifiersSaverReturn => {
  const dispatch = useDispatch();
  // Snapshot at click time; nothing here needs to re-render on state changes.
  const store = useStore<RootState>();
  const [isSaving, setIsSaving] = useState(false);

  const saveClassifiers = useCallback(async (): Promise<void> => {
    setIsSaving(true);
    const taskId = generateUUID();
    const task: AppTask = {
      id: taskId,
      type: "classifier-download",
      status: "running",
      progress: 0,
      label: "Collecting classifiers",
      startedAt: Date.now(),
    };
    dispatch(appTasksSlice.actions.taskRegistered(task));

    try {
      const { classifier, data } = store.getState();

      // Model names are the worker registry's keys, so dedupe across kinds
      // the same way ProjectSaver does.
      const runsByModel = new Map<string, Run[]>();
      for (const kc of Object.values(classifier.kindClassifiers)) {
        for (const [name, info] of Object.entries(kc.modelInfoDict)) {
          if (!runsByModel.has(name)) runsByModel.set(name, info.runs);
        }
      }

      const cfApi = getClassifierApi();
      const entries: Parameters<typeof buildClassifiersBundle>[0] = [];
      const skipped: string[] = [];
      let done = 0;
      for (const [modelName, runs] of runsByModel) {
        try {
          const result = await cfApi.getSavedModelData(modelName);
          if (result.success) {
            entries.push({
              modelName,
              modelData: {
                modelJson: result.data.modelJson.blob,
                modelWeights: result.data.modelWeights.blob,
              },
              runs,
            });
          } else {
            skipped.push(modelName);
          }
        } catch {
          // A crashed or terminated worker rejects instead of returning err().
          skipped.push(modelName);
        }
        dispatch(
          appTasksSlice.actions.taskUpdated({
            id: taskId,
            progress: Math.round((++done / runsByModel.size) * 90),
          }),
        );
      }

      if (entries.length > 0) {
        saveAs(
          await buildClassifiersBundle(entries),
          `${data.experiment.name}-classifiers.zip`,
        );
        if (skipped.length === 0) {
          dispatch(
            appTasksSlice.actions.taskCompleted({
              id: taskId,
              label: `Saved ${entries.length} classification ${pluralize("model", entries.length)}`,
            }),
          );
        } else {
          dispatch(
            appTasksSlice.actions.taskFailed({
              id: taskId,
              error: `Some models failed to save: ${skipped.join(", ")}. Models which have not been trained are skipped.`,
            }),
          );
        }
      } else {
        if (skipped.length === 0) {
          dispatch(
            appTasksSlice.actions.taskFailed({
              id: taskId,
              error: "No classifiers found in project",
            }),
          );
        } else {
          dispatch(
            appTasksSlice.actions.taskFailed({
              id: taskId,
              error: `Could not download classifiers: ${skipped.join(", ")}.`,
            }),
          );
        }
      }
    } catch (err) {
      dispatch(
        appTasksSlice.actions.taskFailed({
          id: taskId,
          error:
            err instanceof Error ? err.message : "Failed to save classifiers",
        }),
      );
    } finally {
      setIsSaving(false);
    }
  }, [dispatch, store]);

  return { saveClassifiers, isSaving };
};
