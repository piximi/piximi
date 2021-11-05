import {
  Box,
  Button,
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
import IconButton from "@mui/material/IconButton";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import { Alert } from "@mui/lab";

export const TaskSelect = () => {
  const classes = useStyles();

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

  const modelType: string = task === Task.Classify ? "classifier" : "segmenter";

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

  const onPredict = async () => {
    dispatch(classifierSlice.actions.predict({}));
  };

  return (
    <>
      <FormControl className={classes.taskSelector} size={"small"}>
        <InputLabel id="demo-simple-select-label">Task?</InputLabel>
        <Select
          labelId="demo-simple-select-label"
          id="demo-simple-select"
          value={parsedTaskMap[task]}
          label={"Task?"}
          onChange={onTaskSelect}
        >
          <MenuItem value={parsedTaskMap[Task.Classify]}>Classify</MenuItem>
          <MenuItem value={parsedTaskMap[Task.Segment]}>Segment</MenuItem>
          <MenuItem disabled value={parsedTaskMap[Task.Annotate]}>
            Annotate
          </MenuItem>
        </Select>
      </FormControl>
      {task !== Task.Annotate && (
        <FormControl className={classes.trainFlagSelector} size={"small"}>
          <InputLabel id="demo-simple-select-label">
            Apply existing {modelType} or train new one?
          </InputLabel>
          <Select
            value={parsedTrainFlagMap[trainFlag]}
            onChange={onTrainFlagSelect}
            displayEmpty
            label={"Apply existing {modelType} or train new one?"}
          >
            <MenuItem value={"apply"}>Apply {modelType}</MenuItem>
            <MenuItem disabled value={"train"}>
              Train Classifier
            </MenuItem>
          </Select>
        </FormControl>
      )}
      <FormControl className={classes.trainFlagSelector} size={"small"}>
        <Box>
          <Button color="inherit" onClick={onPredict}>
            <IconButton color="inherit">
              <PlayArrowIcon />
            </IconButton>
            Run Classifier
          </Button>
          {/*<Alert severity="error">Please upload your "trained.zip" file first!</Alert>*/}
        </Box>
      </FormControl>
    </>
  );
};
