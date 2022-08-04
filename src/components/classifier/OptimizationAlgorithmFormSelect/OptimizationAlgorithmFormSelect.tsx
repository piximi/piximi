import React from "react";
import { useDispatch, useSelector } from "react-redux";

import {
  FormHelperText,
  MenuItem,
  Select,
  SelectChangeEvent,
} from "@mui/material";

import { optimizationAlgorithmSelector } from "store/selectors";

import { classifierSlice } from "store/slices";

import { OptimizationAlgorithm } from "types";
import { enumKeys } from "utils";

export const OptimizationAlgorithmFormSelect = () => {
  const dispatch = useDispatch();

  const optimizationAlgorithm = useSelector(optimizationAlgorithmSelector);
  const onOptimizationAlgorithmChange = (event: SelectChangeEvent) => {
    const target = event.target as HTMLInputElement; //target.value is string
    const optimizationAlgorithm = target.value as OptimizationAlgorithm;

    dispatch(
      classifierSlice.actions.updateOptimizationAlgorithm({
        optimizationAlgorithm: optimizationAlgorithm,
      })
    );
  };

  return (
    <>
      <FormHelperText>Optimization Algorithm</FormHelperText>
      <Select
        value={optimizationAlgorithm as string}
        onChange={onOptimizationAlgorithmChange}
        displayEmpty
        inputProps={{ "aria-label": "Without label" }}
        sx={(theme) => ({
          flexBasis: 300,
          width: "100%",
          marginRight: theme.spacing(1),
          marginTop: theme.spacing(0),
        })}
      >
        {enumKeys(OptimizationAlgorithm).map((k) => {
          return (
            <MenuItem key={k} value={OptimizationAlgorithm[k]}>
              {OptimizationAlgorithm[k]}
            </MenuItem>
          );
        })}
      </Select>
    </>
  );
};
