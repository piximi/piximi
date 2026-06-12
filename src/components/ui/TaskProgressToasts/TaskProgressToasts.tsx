import React from "react";
import { useSelector } from "react-redux";

import { Stack } from "@mui/material";

import { selectDisplayableTasks } from "store/appTasks/selectors";

import { TaskProgressToast } from "./TaskProgressToast";

export const TaskProgressToasts = () => {
  const tasks = useSelector(selectDisplayableTasks);

  if (tasks.length === 0) return null;

  return (
    <Stack
      spacing={1}
      sx={{
        position: "fixed",
        bottom: 16,
        right: 16,
        width: 340,
        maxHeight: "60vh",
        overflowY: "auto",
        // above MUI Dialog (1300) so training progress stays visible while
        // the FitClassifierDialog is open; below tooltips and the AlertBar
        zIndex: (theme) => theme.zIndex.snackbar,
        pointerEvents: "none",
      }}
    >
      {tasks.map((task) => (
        <TaskProgressToast key={task.id} task={task} />
      ))}
    </Stack>
  );
};
