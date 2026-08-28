import { createSelector } from "@reduxjs/toolkit";

import type { RootState } from "store/rootReducer";

import type { AppTaskType } from "./types";

const selectTasksDict = (state: RootState) => state.appTasks.tasks;

// Memoized so downstream selectors (and the toast component) only recompute
// when the tasks dictionary actually changes.
const selectAllTasks = createSelector(selectTasksDict, (tasks) =>
  Object.values(tasks),
);

const selectActiveTasks = createSelector(selectAllTasks, (tasks) =>
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

// All tasks, every status (finished ones persist until dismissed), in stable
// start order — drives the toast stack.
export const selectDisplayableTasks = createSelector(selectAllTasks, (tasks) =>
  tasks.filter((t) => !t.dismissed).sort((a, b) => a.startedAt - b.startedAt),
);

// Progress is stored on a 0-100 scale; -1 marks an indeterminate task.
// Returns null when idle, -1 when only indeterminate tasks are active.
export const selectOverallTaskProgress = createSelector(
  selectActiveTasks,
  (tasks) => {
    if (tasks.length === 0) return null;
    const determinate = tasks.filter((t) => t.progress >= 0);
    if (determinate.length === 0) return -1;
    const total = determinate.reduce((sum, t) => sum + t.progress, 0);
    return Math.round(total / determinate.length);
  },
);
