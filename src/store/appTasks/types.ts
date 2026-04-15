// types.ts
export type AppTaskType =
  | "file-upload"
  | "project-upload"
  | "project-download"
  | "image-classification"
  | "image-segmentation"
  | "measurement";

export type AppTaskStatus =
  | "pending"
  | "running"
  | "success"
  | "error"
  | "cancelled";

export interface AppTask {
  id: string; // random id
  type: AppTaskType;
  status: AppTaskStatus;
  progress: number; // 0–100
  label: string; // Human-readable: "Uploading project.zip"
  entityId?: string; // e.g. projectId, imageId — for filtering
  error?: string;
  startedAt: number;
  completedAt?: number;
  meta?: Record<string, unknown>; // anything extra (file size, model name, etc.)
}

export interface AppTasksState {
  tasks: Record<string, AppTask>;
}
