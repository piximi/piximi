// tasksSlice.ts
import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { AppTask, AppTasksState, AppTaskStatus } from "./types";

const initialState: AppTasksState = { tasks: {} };

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
      }>,
    ) {
      const task = state.tasks[action.payload.id];
      if (!task) return;
      task.progress = action.payload.progress;
      if (action.payload.status) task.status = action.payload.status;
    },
    taskCompleted(state, action: PayloadAction<{ id: string }>) {
      const task = state.tasks[action.payload.id];
      if (!task) return;
      task.status = "success";
      task.progress = 100;
      task.completedAt = Date.now();
    },
    taskFailed(state, action: PayloadAction<{ id: string; error: string }>) {
      const task = state.tasks[action.payload.id];
      if (!task) return;
      task.status = "error";
      task.error = action.payload.error;
      task.completedAt = Date.now();
    },
    taskCancelled(state, action: PayloadAction<{ id: string }>) {
      const task = state.tasks[action.payload.id];
      if (!task) return;
      task.status = "cancelled";
      task.completedAt = Date.now();
    },
    taskDismissed(state, action: PayloadAction<{ id: string }>) {
      delete state.tasks[action.payload.id];
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
