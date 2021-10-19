import React from "react";
import { useDispatch, useSelector } from "react-redux";
import { classifierSlice } from "../../store/slices";
import { fitOptionsSelector } from "../../store/selectors";
import { TextField } from "@mui/material";

export const BatchSizeTextField = () => {
  const dispatch = useDispatch();

  const fitOptions = useSelector(fitOptionsSelector);

  const onBatchSizeChange = (event: React.ChangeEvent<{ value: unknown }>) => {
    dispatch(
      classifierSlice.actions.updateBatchSize({
        batchSize: parseFloat(event.target.value as string),
      })
    );
  };

  return (
    <TextField
      fullWidth
      helperText="&nbsp;"
      id="batch-size"
      label="Batch size"
      onChange={onBatchSizeChange}
      type="number"
      value={fitOptions.batchSize}
    />
  );
};
