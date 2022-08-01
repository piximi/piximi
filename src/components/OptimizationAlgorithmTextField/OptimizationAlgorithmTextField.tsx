import React from "react";
import { useDispatch, useSelector } from "react-redux";

import MenuItem from "@mui/material/MenuItem";
import TextField from "@mui/material/TextField";

import { compileOptionsSelector } from "store/selectors";

import { classifierSlice } from "store/slices";

import { OptimizationAlgorithm } from "types/OptimizationAlgorithm";

const enumKeys = <O extends object, K extends keyof O = keyof O>(
  obj: O
): K[] => {
  return Object.keys(obj).filter((k) => Number.isNaN(+k)) as K[];
};

export const OptimizationAlgorithmTextField = () => {
  const dispatch = useDispatch();

  const compileOptions = useSelector(compileOptionsSelector);

  const onOptimizationAlgorithmChange = (
    event: React.ChangeEvent<{ value: unknown }>
  ) => {
    dispatch(
      classifierSlice.actions.updateOptimizationAlgorithm({
        optimizationAlgorithm: event.target.value as OptimizationAlgorithm,
      })
    );
  };

  return (
    <TextField
      fullWidth
      helperText="&nbsp;"
      id="optimization-algorithm"
      label="Optimization algorithm"
      onChange={onOptimizationAlgorithmChange}
      select
      value={compileOptions.optimizationAlgorithm}
    >
      {enumKeys(OptimizationAlgorithm).map((k) => {
        return (
          <MenuItem key={k} value={OptimizationAlgorithm[k]}>
            {OptimizationAlgorithm[k]}
          </MenuItem>
        );
      })}
    </TextField>
  );
};
