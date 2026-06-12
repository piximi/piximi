import React, {
  CSSProperties,
  useCallback,
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
  SvgIconOwnProps,
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
  success: 5000,
  cancelled: 3000,
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

export const TaskProgressToast = ({ task }: { task: AppTask }) => {
  const dispatch = useDispatch();
  const isActive = task.status === "pending" || task.status === "running";

  const statusIcon = useCallback(
    (size: SvgIconOwnProps["fontSize"]) => {
      const style: CSSProperties = {
        position: "absolute",
        top: "2px",
        left: "2px",
      };
      switch (task.status) {
        case "success":
          return (
            <CheckCircleOutline color="inherit" fontSize={size} sx={style} />
          );
        case "cancelled":
          return <CancelOutlined color="inherit" fontSize={size} sx={style} />;
        case "error":
          return <ErrorOutline color="inherit" fontSize={size} sx={style} />;
        default:
          return null;
      }
    },
    [task.status],
  );

  const hasStatusIcon = useMemo(() => {
    switch (task.status) {
      case "success":
      case "cancelled":
      case "error":
        return true;
      default:
        return false;
    }
  }, [task.status]);

  const actionButton = useMemo(() => {
    const actionButtonStyle: CSSProperties = {
      position: "absolute",
      top: "2px",
      right: "2px",
      padding: 0,
    };
    if (isActive && task.cancellable)
      return (
        <IconButton
          size="small"
          aria-label="cancel task"
          color="inherit"
          onClick={() => {
            dispatch(
              appTasksSlice.actions.taskFailed({
                id: task.id,
                error:
                  "This is an error This is an error This is an error This is an error This is an error This is an error This is an error This is an error This is an error This is an error This is an error This is an error",
              }),
            );
            //taskCancelRegistry.cancel(task.id);
          }}
          sx={actionButtonStyle}
        >
          <Stop fontSize="small" />
        </IconButton>
      );
    else if (!isActive)
      return (
        <IconButton
          size="small"
          aria-label="dismiss notification"
          color="inherit"
          onClick={() =>
            dispatch(appTasksSlice.actions.taskDismissed({ id: task.id }))
          }
          sx={actionButtonStyle}
        >
          <Close fontSize="small" />
        </IconButton>
      );
    else return <></>;
  }, [isActive, task.cancellable]);

  useEffect(() => {
    const delay = AUTO_DISMISS_MS[task.status];
    if (delay === undefined) return;
    const timer = setTimeout(() => {
      dispatch(appTasksSlice.actions.taskDismissed({ id: task.id }));
      taskCancelRegistry.unregister(task.id);
    }, delay);
    return () => clearTimeout(timer);
  }, [task.status, task.id, dispatch]);

  return (
    <Paper
      elevation={6}
      role="status"
      aria-live="polite"
      sx={(theme) => ({
        pointerEvents: "auto",
        bgcolor:
          task.status === "error"
            ? theme.palette.Alert.errorFilledBg
            : theme.palette.primary.dark,
        color: theme.palette.grey[900],
        borderRadius: 1,
      })}
    >
      <Stack direction="row">
        {statusIcon("small")}
        <Box sx={{ flexGrow: 1, minWidth: 0, px: 1 }}>
          <Box sx={{ pl: hasStatusIcon ? 1 : 0 }}>
            <Typography variant="body1" fontWeight="bold" noWrap sx={{ pl: 1 }}>
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
              <Typography variant="body2" noWrap sx={{ pl: 1 }}>
                {task.label}
              </Typography>
            )}
          </Box>
        </Box>
        {actionButton}
      </Stack>
      {isActive &&
        (task.progress < 0 ? (
          <LinearProgress color="inherit" sx={{ m: 1 }} />
        ) : (
          <LinearProgress
            variant="determinate"
            value={Math.min(100, task.progress)}
            color="inherit"
            sx={{ m: 1 }}
          />
        ))}
    </Paper>
  );
};
