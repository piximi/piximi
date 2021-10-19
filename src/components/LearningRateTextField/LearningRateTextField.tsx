import React from "react";
import { useDispatch, useSelector } from "react-redux";
import { classifierSlice } from "../../store/slices";
import { compileOptionsSelector } from "../../store/selectors";
import { TextField } from "@mui/material";

export const LearningRateTextField = () => {
  const dispatch = useDispatch();

  const compileOptions = useSelector(compileOptionsSelector);

  const onLearningRateChange = (
    event: React.ChangeEvent<{ value: unknown }>
  ) => {
    dispatch(
      classifierSlice.actions.updateLearningRate({
        learningRate: parseFloat(event.target.value as string),
      })
    );
  };

  return (
    <TextField
      fullWidth
      helperText="&nbsp;"
      id="learning-rate"
      label="Learning rate"
      onChange={onLearningRateChange}
      type="number"
      value={compileOptions.learningRate}
    />
  );
};
