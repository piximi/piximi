import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";

import { useDispatch } from "react-redux";

import type { Theme } from "@mui/material";
import {
  Box,
  Button,
  IconButton,
  LinearProgress,
  Paper,
  Typography,
} from "@mui/material";
import { Remove as Rm } from "@mui/icons-material";

import { appTasksSlice } from "store/appTasks/appTasksSlice";
import type { AppTask, AppTaskStatus } from "store/appTasks/types";
import { taskCancelRegistry } from "store/appTasks/taskCancelRegistry";
import { taskTypeDisplayLookup } from "store/appTasks/utils";

const AUTO_DISMISS_MS: Partial<Record<AppTaskStatus, number>> = {
  success: 3000,
  cancelled: 3000,
};

const getToastColors = (theme: Theme, status: AppTask["status"]) => {
  switch (status) {
    case "error":
      return {
        borderColor: theme.palette.Alert.errorFilledBg,
      };
    case "success":
      return {
        borderColor: theme.palette.Alert.successFilledBg,
      };
    case "cancelled":
      return {
        borderColor: theme.palette.Alert.warningColor,
      };
    default:
      return {
        borderColor: theme.palette.primary.dark,
      };
  }
};

export const TaskProgressToast = ({ task }: { task: AppTask }) => {
  const dispatch = useDispatch();
  const isActive = task.status === "pending" || task.status === "running";

  const dismissTask = () => {
    dispatch(appTasksSlice.actions.taskDismissed({ id: task.id }));
    taskCancelRegistry.unregister(task.id);
  };

  const progressBar = useMemo(() => {
    const PROGRESS_STYLE = (theme: Theme) => ({
      height: "5px",
      color: theme.palette.primary.main,
      borderRadius: 999,
      backgroundColor: "action.hover",
      "& .MuiLinearProgress-bar": {
        borderRadius: 999,
      },
      top: task.cancellable ? 0 : "calc((1rem - 5px) / 2)",
    });
    return task.progress < 0 ? (
      <LinearProgress color="inherit" sx={PROGRESS_STYLE} />
    ) : (
      <LinearProgress
        variant="determinate"
        value={Math.min(100, task.progress)}
        color="inherit"
        sx={PROGRESS_STYLE}
      />
    );
  }, [task.progress, task.cancellable]);

  useEffect(() => {
    const delay = AUTO_DISMISS_MS[task.status];
    if (delay === undefined) return;
    const timer = setTimeout(() => {
      dismissTask();
    }, delay);
    return () => clearTimeout(timer);
  }, [task.status, task.id, dispatch]);

  return (
    <Paper
      elevation={6}
      role="status"
      aria-live="polite"
      sx={(theme) => ({
        position: "relative",
        pointerEvents: "auto",
        border: "1px solid",
        ...getToastColors(theme, task.status),
        p: "14px 16px",
        borderRadius: 2,
      })}
    >
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <Typography
          variant="body2"
          fontWeight={500}
          lineHeight={1.3}
          color="text.primary"
        >
          {taskTypeDisplayLookup[task.type]}
        </Typography>
        <ActionButton dismissTask={dismissTask} />
      </Box>
      <Box>
        <Typography variant="caption" color="text.secondary" display="block">
          {task.label}
        </Typography>
      </Box>

      {task.status === "error" && task.error ? (
        <ErrorText error={task.error} />
      ) : (
        isActive && (
          <Box sx={{ height: "1rem", mt: 0.5 }}>
            {progressBar}
            {task.cancellable && (
              <Button
                variant="text"
                color="error"
                sx={{ fontSize: "0.75rem", p: 0, minWidth: 0 }}
                onClick={() => taskCancelRegistry.cancel(task.id)}
              >
                Stop
              </Button>
            )}
          </Box>
        )
      )}
    </Paper>
  );
};

const ActionButton = ({ dismissTask }: { dismissTask: () => void }) => {
  return (
    <Box sx={{ display: "flex", alignItems: "center" }}>
      <IconButton
        size="small"
        aria-label="dismiss notification"
        color="inherit"
        onClick={dismissTask}
        sx={(theme) => ({
          p: 0,
          border: `1px solid ${theme.palette.text.primary}`,
          borderRadius: 1,
        })}
      >
        <Rm viewBox="0 3 24 18" sx={{ fontSize: "1rem", height: "12px" }} />
      </IconButton>
    </Box>
  );
};

const ErrorText = ({ error }: { error: string }) => {
  const textRef = useRef<HTMLElement>(null);
  const [isOverflowing, setIsOverflowing] = useState(false);
  const [expanded, setExpanded] = useState(false);

  useLayoutEffect(() => {
    const el = textRef.current;
    if (!el) return;
    const check = () => {
      if (expanded) return;
      setIsOverflowing(el.scrollWidth > el.clientWidth); // horizontal check now
    };
    check();
    const ro = new ResizeObserver(check);
    ro.observe(el);
    return () => ro.disconnect();
  }, [error, expanded]);

  const toggle = isOverflowing && (
    <Typography
      variant="caption"
      component="button"
      onClick={() => setExpanded((e) => !e)}
      sx={{
        background: "none",
        border: 0,
        cursor: "pointer",
        p: 0,
        color: "inherit",
        textDecoration: "underline",
        whiteSpace: "nowrap",
        flexShrink: 0,
      }}
    >
      {expanded ? "Show less" : "Show more"}
    </Typography>
  );

  return expanded ? (
    <Box sx={{ overflowWrap: "break-word" }}>
      <Typography
        variant="caption"
        color="inherit"
        sx={{ display: "inline", mr: 0.5 }}
      >
        {error}
      </Typography>
      {toggle}
    </Box>
  ) : (
    <Box
      sx={{ display: "flex", alignItems: "baseline", gap: 0.5, height: "1rem" }}
    >
      <Typography
        ref={textRef}
        variant="caption"
        color="inherit"
        noWrap
        sx={{ minWidth: 0 }}
      >
        {error}
      </Typography>
      {toggle}
    </Box>
  );
};
