import React from "react";
import TextField from "@material-ui/core/TextField";
import { useDispatch, useSelector } from "react-redux";
import { classifierSlice } from "../../store/slices";
import { fitOptionsSelector } from "../../store/selectors";

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
