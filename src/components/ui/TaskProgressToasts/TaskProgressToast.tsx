import React, {
  CSSProperties,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useDispatch } from "react-redux";

import {
  Box,
  IconButton,
  LinearProgress,
  Paper,
  Stack,
  Theme,
  Typography,
} from "@mui/material";
import {
  CancelOutlined,
  CheckCircleOutline,
  Close,
  ErrorOutline,
  Stop,
} from "@mui/icons-material";

import { appTasksSlice } from "store/appTasks/appTasksSlice";
import type { AppTask, AppTaskStatus } from "store/appTasks/types";
import { taskCancelRegistry } from "store/appTasks/taskCancelRegistry";
import { taskTypeDisplayLookup } from "store/appTasks/utils";

const AUTO_DISMISS_MS: Partial<Record<AppTaskStatus, number>> = {
  success: 3000,
  cancelled: 3000,
};

const PROGRESS_STYLE: CSSProperties = { marginBlock: 1, marginInline: 2 };

const getToastColors = (theme: Theme, status: AppTask["status"]) => {
  switch (status) {
    case "error":
      return {
        bgcolor: theme.palette.Alert.errorFilledBg,
        color: theme.palette.grey[900],
      };
    default:
      return {
        bgcolor: theme.palette.primary.dark,
        color: theme.palette.grey[900],
      };
  }
};

export const TaskProgressToast = ({ task }: { task: AppTask }) => {
  const dispatch = useDispatch();
  const isActive = task.status === "pending" || task.status === "running";

  const statusIcon = useStatus(task.status);

  const hasStatusIcon = useMemo(() => !!statusIcon, [statusIcon]);

  const dismissTask = () => {
    dispatch(appTasksSlice.actions.taskDismissed({ id: task.id }));
    taskCancelRegistry.unregister(task.id);
  };

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
        ...getToastColors(theme, task.status),
        borderRadius: 1,
      })}
    >
      <Stack direction="row" sx={{ mb: isActive ? 0 : 1 }}>
        {statusIcon}
        <Box sx={{ flexGrow: 1, minWidth: 0, px: 0.5 }}>
          <Box sx={{ pl: hasStatusIcon ? 1.5 : 0 }}>
            <Typography
              variant="body1"
              fontWeight="bold"
              noWrap
              sx={{ pl: 1, lineHeight: "1rem", mt: 0.5 }}
              gutterBottom={false}
            >
              {taskTypeDisplayLookup[task.type]}
            </Typography>
          </Box>
          <Box>
            {task.status === "error" && task.error ? (
              <Typography
                variant="caption"
                color="inherit"
                sx={{ display: "block", overflowWrap: "break-word" }}
              >
                <ErrorText error={task.error} />
              </Typography>
            ) : (
              <Typography
                variant="body2"
                noWrap
                sx={{ pl: 2, lineHeight: "1rem" }}
              >
                {task.label}
              </Typography>
            )}
          </Box>
        </Box>
        <ActionButton
          taskId={task.id}
          isActive={isActive}
          isCancellable={!!task.cancellable}
          dismissTask={dismissTask}
        />
      </Stack>
      {isActive &&
        (task.progress < 0 ? (
          <LinearProgress color="inherit" sx={PROGRESS_STYLE} />
        ) : (
          <LinearProgress
            variant="determinate"
            value={Math.min(100, task.progress)}
            color="inherit"
            sx={PROGRESS_STYLE}
          />
        ))}
    </Paper>
  );
};

const ACTION_BUTTON_STYLE: CSSProperties = {
  position: "absolute",
  top: "2px",
  right: "2px",
  padding: 0,
};
const ActionButton = ({
  taskId,
  isActive,
  isCancellable,
  dismissTask,
}: {
  taskId: string;
  isActive: boolean;
  isCancellable: boolean;
  dismissTask: () => void;
}) => {
  if (isActive)
    if (isCancellable)
      return (
        <IconButton
          size="small"
          aria-label="cancel task"
          color="inherit"
          onClick={() => {
            taskCancelRegistry.cancel(taskId);
          }}
          sx={ACTION_BUTTON_STYLE}
        >
          <Stop fontSize="small" />
        </IconButton>
      );
    else return <></>;
  else
    return (
      <IconButton
        size="small"
        aria-label="dismiss notification"
        color="inherit"
        onClick={dismissTask}
        sx={ACTION_BUTTON_STYLE}
      >
        <Close fontSize="small" />
      </IconButton>
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
    <Box sx={{ display: "flex", alignItems: "baseline", gap: 0.5 }}>
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

const STATUS_ICON_STYLE: CSSProperties = {
  position: "absolute",
  top: "4px",
  left: "4px",
  fontSize: "inherit",
};
const useStatus = (status: AppTask["status"]) => {
  const statusIcon = useMemo(() => {
    switch (status) {
      case "success":
        return <CheckCircleOutline color="inherit" sx={STATUS_ICON_STYLE} />;
      case "cancelled":
        return <CancelOutlined color="inherit" sx={STATUS_ICON_STYLE} />;
      case "error":
        return <ErrorOutline color="inherit" sx={STATUS_ICON_STYLE} />;
      default:
        return null;
    }
  }, [status]);

  return statusIcon;
};
