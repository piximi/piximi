import { useDispatch, useSelector } from "react-redux";

import {
  Box,
  ButtonBase,
  CircularProgress,
  Paper,
  Typography,
} from "@mui/material";

import { appTasksSlice } from "store/appTasks/appTasksSlice";
import { selectHiddenActiveTasks } from "store/appTasks/selectors";

import { pluralize } from "utils/stringUtils";

import type { AppTask } from "store/appTasks/types";

/**
 * What the chip shows for the minimised, still-running tasks.
 *
 * `progress` is on the toast's 0–100 scale, with -1 meaning indeterminate
 * (renders as an animated circle). Each task's own `progress` uses the same
 * convention: -1 for tasks that cannot report a percentage.
 */
export const summarizeHiddenTasks = (tasks: AppTask[]) => {
  const label = `Show ${tasks.length} ${pluralize("task", tasks.length)}`;
  const determinate = tasks.filter((t) => t.progress >= 0);
  const progress =
    determinate.length === 0
      ? -1
      : Math.round(
          determinate.reduce((sum, t) => sum + t.progress, 0) /
            determinate.length,
        );
  return { label, progress };
};

/**
 * Stands in for minimised toasts while their tasks are still running, so the
 * user can always tell work is in progress and bring it back. Clicking
 * restores every hidden running task.
 */
export const TaskTrayChip = () => {
  const dispatch = useDispatch();
  const hidden = useSelector(selectHiddenActiveTasks);

  if (hidden.length === 0) return null;

  const { label, progress } = summarizeHiddenTasks(hidden);

  return (
    <Paper
      elevation={6}
      sx={(theme) => ({
        pointerEvents: "auto",
        alignSelf: "flex-end",
        border: "1px solid",
        borderColor: theme.palette.primary.dark,

        overflow: "hidden",
      })}
    >
      <ButtonBase
        aria-label={`Show ${hidden.length} running ${pluralize("task", hidden.length)}`}
        onClick={() => dispatch(appTasksSlice.actions.hiddenActiveTasksShown())}
        sx={{
          px: 1.5,
          py: 0.75,
          borderRadius: 2,
          textAlign: "left",
          "&:hover .show-text, &:focus-visible .show-text": {
            gridTemplateColumns: "1fr",
            mr: 1,
          },
        }}
      >
        <Box
          className="show-text"
          sx={(theme) => ({
            display: "grid",
            gridTemplateColumns: "0fr",
            transition: theme.transitions.create([
              "grid-template-columns",
              "margin-right",
            ]),
          })}
        >
          <Typography
            variant="caption"
            sx={{
              minWidth: 0, // lets the column actually shrink to 0
              overflow: "hidden",
              whiteSpace: "nowrap",
              color: "var(--mui-palette-primary-main)",
              textTransform: "uppercase",
              fontWeight: 500,
            }}
          >
            {label}
          </Typography>
        </Box>

        {progress < 0 ? (
          <CircularProgress size="1.25em" />
        ) : (
          <CircularProgress
            variant="determinate"
            size="1.25em"
            value={Math.min(100, progress)}
          />
        )}
      </ButtonBase>
    </Paper>
  );
};
