import React from "react";
import MenuItem from "@material-ui/core/MenuItem";
import TextField from "@material-ui/core/TextField";
import { useDispatch, useSelector } from "react-redux";
import { OptimizationAlgorithm } from "../../../../../../../../../types/OptimizationAlgorithm";
import { classifierSlice } from "../../../../../../../../../store/slices";
import { compileOptionsSelector } from "../../../../../../../../../store/selectors";

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
