// tasksSelectors.ts
import { createSelector } from "@reduxjs/toolkit";
import { RootState } from "store/rootReducer";
import { AppTaskType } from "./types";

const selectAllTasks = (state: RootState) =>
  Object.values(state.appTasks.tasks);

export const selectActiveTasks = createSelector(selectAllTasks, (tasks) =>
  tasks.filter((t) => t.status === "pending" || t.status === "running"),
);

export const selectTasksByType = createSelector(
  [selectAllTasks, (_: RootState, type: AppTaskType) => type],
  (tasks, type) => tasks.filter((t) => t.type === type),
);

export const selectTasksByEntity = createSelector(
  [selectAllTasks, (_: RootState, entityId: string) => entityId],
  (tasks, entityId) => tasks.filter((t) => t.entityId === entityId),
);

export const selectHasRunningTasks = createSelector(
  selectActiveTasks,
  (tasks) => tasks.length > 0,
);

export const selectOverallTaskProgress = createSelector(
  selectActiveTasks,
  (tasks) => {
    if (tasks.length == 0) return null;
    let overallPercent: number = 0;
    tasks.forEach((task) => (overallPercent += task.progress));
    overallPercent = Math.round((overallPercent / tasks.length) * 100);
    return overallPercent;
  },
);
