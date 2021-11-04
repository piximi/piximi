import {
  FormControl,
  FormHelperText,
  MenuItem,
  Select,
  SelectChangeEvent,
} from "@mui/material";
import { useDispatch, useSelector } from "react-redux";
import { taskSelector } from "../../store/selectors/taskSelector";
import { Task } from "../../types/Task";
import { projectSlice } from "../../store/slices";
import * as React from "react";
import { trainFlagSelector } from "../../store/selectors/trainFlagSelector";

export const TaskSelect = () => {
  const task = useSelector(taskSelector);
  const trainFlag = useSelector(trainFlagSelector);

  const parsedTaskMap: { [key: string]: string } = {
    0: "Classify",
    1: "Segment",
    2: "Annotate",
  };

  const parsedTrainFlagMap: { [key: string]: string } = {
    0: "apply",
    1: "train",
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

  const onTrainFlagSelect = (event: SelectChangeEvent) => {
    const target = event.target as HTMLInputElement;
    let unparsedTrainFlag: number = 0;
    for (let key in parsedTrainFlagMap) {
      if (parsedTrainFlagMap[key] === target.value) {
        unparsedTrainFlag = parseInt(key);
      }
      dispatch(
        projectSlice.actions.updateTrainFlag({ trainFlag: unparsedTrainFlag })
      );
    }
  };

  return (
    <>
      <FormControl sx={{ m: 1, minWidth: 120 }}>
        <Select
          labelId="demo-simple-select-helper-label"
          id="demo-simple-select-helper"
          value={parsedTaskMap[task]}
          onChange={onTaskSelect}
        >
          <MenuItem value={parsedTaskMap[Task.Classify]}>Classify</MenuItem>
          <MenuItem value={parsedTaskMap[Task.Segment]}>Segment</MenuItem>
          <MenuItem disabled value={parsedTaskMap[Task.Annotate]}>
            Annotate
          </MenuItem>
        </Select>
        <FormHelperText>Task</FormHelperText>
      </FormControl>
      {task !== Task.Annotate && (
        <FormControl sx={{ m: 1, minWidth: 120 }}>
          <Select
            value={parsedTrainFlagMap[trainFlag]}
            onChange={onTrainFlagSelect}
            displayEmpty
            inputProps={{ "aria-label": "Without label" }}
          >
            <MenuItem value={"apply"}>Apply Classifier</MenuItem>
            <MenuItem disabled value={"train"}>
              Train Classifier
            </MenuItem>
          </Select>
          <FormHelperText>Do you have a pre-trained network?</FormHelperText>
        </FormControl>
      )}
    </>
  );
};
