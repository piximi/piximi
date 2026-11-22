// tasksSlice.ts
import { createSlice } from "@reduxjs/toolkit";

import type { PayloadAction } from "@reduxjs/toolkit";

import type { AppTask, AppTasksState, AppTaskStatus } from "./types";

const initialState: AppTasksState = { tasks: {} };

/** Running from the user's point of view — "stopping" is still in flight. */
export const isActiveStatus = (status: AppTaskStatus) =>
  status === "pending" || status === "running" || status === "stopping";

export const appTasksSlice = createSlice({
  name: "tasks",
  initialState,
  reducers: {
    taskRegistered(state, action: PayloadAction<AppTask>) {
      state.tasks[action.payload.id] = action.payload;
    },
    taskUpdated(
      state,
      action: PayloadAction<{
        id: string;
        progress: number;
        status?: AppTaskStatus;
        label?: string;
      }>,
    ) {
      const task = state.tasks[action.payload.id];
      if (!task) return;
      if (task.status === "stopping" && action.payload.status !== "cancelled")
        return;
      task.progress = action.payload.progress;
      if (action.payload.status) task.status = action.payload.status;
      if (action.payload.label) task.label = action.payload.label;
    },

    taskCompleted(
      state,
      action: PayloadAction<{ id: string; label?: string }>,
    ) {
      const { id, label } = action.payload;
      const task = state.tasks[id];
      if (!task) return;
      task.status = "success";
      task.progress = 100;
      if (label) task.label = label;
      else task.label = "Task completed successfuly";
      task.completedAt = Date.now();
    },
    taskFailed(state, action: PayloadAction<{ id: string; error: string }>) {
      const task = state.tasks[action.payload.id];
      if (!task) return;
      task.status = "error";
      task.error = action.payload.error;
      task.completedAt = Date.now();
      // A failure must never go unseen, even if the user hid the task.
      task.dismissed = false;
    },
    taskCancelled(state, action: PayloadAction<{ id: string }>) {
      const task = state.tasks[action.payload.id];
      if (!task) return;
      task.status = "cancelled";
      task.label = "Cancelled";
      task.completedAt = Date.now();
    },
    taskDismissed(state, action: PayloadAction<{ id: string }>) {
      const task = state.tasks[action.payload.id];
      if (task) task.dismissed = true;
    },
    taskShow(state, action: PayloadAction<string>) {
      const task = state.tasks[action.payload];
      if (task) task.dismissed = false;
    },
    // Restore every hidden task that is still running (the tray chip's click).
    hiddenActiveTasksShown(state) {
      for (const task of Object.values(state.tasks)) {
        if (task.dismissed && isActiveStatus(task.status))
          task.dismissed = false;
      }
    },
    completedTasksPurged(state) {
      // Call periodically to avoid unbounded growth
      for (const id in state.tasks) {
        const { status } = state.tasks[id];
        if (status === "success" || status === "cancelled") {
          delete state.tasks[id];
        }
      }
    },
  },
});
