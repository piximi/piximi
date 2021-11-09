import {
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  SelectChangeEvent,
} from "@mui/material";
import { useDispatch, useSelector } from "react-redux";
import { taskSelector } from "../../store/selectors/taskSelector";
import { Task } from "../../types/Task";
import { classifierSlice, projectSlice } from "../../store/slices";
import * as React from "react";
import { trainFlagSelector } from "../../store/selectors/trainFlagSelector";
import { useStyles } from "./TaskSelect.css";

export const TaskSelect = () => {
  const classes = useStyles();

  const task = useSelector(taskSelector);

  const parsedTaskMap: { [key: string]: string } = {
    0: "Classify",
    1: "Segment",
    2: "Measure",
    3: "Annotate",
  };

  const dispatch = useDispatch();

  const onTaskSelect = (event: SelectChangeEvent) => {
    const target = event.target as HTMLInputElement;
    let unparsedTask: Task = Task.Classify;
    for (let key in parsedTaskMap) {
      if (parsedTaskMap[key] === target.value) {
        unparsedTask = parseInt(key);
      }
      dispatch(projectSlice.actions.updateTask({ task: unparsedTask }));
    }
  };

  return (
    <>
      <FormControl className={classes.taskSelector} size={"small"}>
        <InputLabel id="demo-simple-select-label">Task</InputLabel>
        <Select
          labelId="demo-simple-select-label"
          id="demo-simple-select"
          value={parsedTaskMap[task]}
          label={"Task"}
          onChange={onTaskSelect}
        >
          <MenuItem value={parsedTaskMap[Task.Classify]}>Classify</MenuItem>
          <MenuItem disabled value={parsedTaskMap[Task.Segment]}>
            Segment
          </MenuItem>
          <MenuItem disabled value={parsedTaskMap[Task.Measure]}>
            Measure
          </MenuItem>
          <MenuItem disabled value={parsedTaskMap[Task.Annotate]}>
            Annotate
          </MenuItem>
        </Select>
      </FormControl>
    </>
  );
};
