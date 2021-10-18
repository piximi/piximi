import React from "react";
import { useDispatch, useSelector } from "react-redux";
import { classifierSlice } from "../../store/slices";
import { fitOptionsSelector } from "../../store/selectors";
import { TextField } from "@mui/material";

export const EpochsTextField = () => {
  const dispatch = useDispatch();

  const fitOptions = useSelector(fitOptionsSelector);

  const onEpochsChange = (event: React.ChangeEvent<{ value: unknown }>) => {
    dispatch(
      classifierSlice.actions.updateEpochs({
        epochs: parseFloat(event.target.value as string),
      })
    );
  };

  return (
    <TextField
      fullWidth
      helperText="&nbsp;"
      id="epochs"
      label="Epochs"
      onChange={onEpochsChange}
      type="number"
      value={fitOptions.epochs}
    />
  );
};
