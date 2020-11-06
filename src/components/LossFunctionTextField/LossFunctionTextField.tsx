import React from "react";
import MenuItem from "@material-ui/core/MenuItem";
import TextField from "@material-ui/core/TextField";
import { useDispatch, useSelector } from "react-redux";
import { LossFunction } from "../../types/LossFunction";
import { classifierSlice } from "../../store/slices";
import { compileOptionsSelector } from "../../store/selectors";

const enumKeys = <O extends object, K extends keyof O = keyof O>(
  obj: O
): K[] => {
  return Object.keys(obj).filter((k) => Number.isNaN(+k)) as K[];
};

export const LossFunctionTextField = () => {
  const dispatch = useDispatch();

  const compileOptions = useSelector(compileOptionsSelector);

  const onLossFunctionChange = (
    event: React.ChangeEvent<{ value: unknown }>
  ) => {
    dispatch(
      classifierSlice.actions.updateLossFunction({
        lossFunction: event.target.value as LossFunction,
      })
    );
  };

  return (
    <TextField
      fullWidth
      helperText="&nbsp;"
      id="loss-function"
      label="Loss function"
      onChange={onLossFunctionChange}
      select
      value={compileOptions.lossFunction}
    >
      {enumKeys(LossFunction).map((k) => {
        return (
          <MenuItem key={k} value={LossFunction[k]}>
            {LossFunction[k]}
          </MenuItem>
        );
      })}
    </TextField>
  );
};
