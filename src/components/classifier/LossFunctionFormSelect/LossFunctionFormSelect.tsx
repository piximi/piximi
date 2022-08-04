import React from "react";
import { useDispatch, useSelector } from "react-redux";

import {
  FormHelperText,
  MenuItem,
  Select,
  SelectChangeEvent,
} from "@mui/material";

import { lossFunctionSelector } from "store/selectors";

import { classifierSlice } from "store/slices";

import { LossFunction } from "types";

import { enumKeys } from "utils";

export const LossFunctionFormSelect = () => {
  const dispatch = useDispatch();
  const lossFunction = useSelector(lossFunctionSelector);

  const onLossFunctionChange = (event: SelectChangeEvent) => {
    const target = event.target as HTMLInputElement; //target.value is string
    const lossFunction = target.value as LossFunction;

    dispatch(
      classifierSlice.actions.updateLossFunction({
        lossFunction: lossFunction,
      })
    );
  };

  return (
    <>
      <FormHelperText>Loss Function</FormHelperText>
      <Select
        value={lossFunction as string}
        onChange={onLossFunctionChange}
        displayEmpty
        inputProps={{ "aria-label": "Without label" }}
        sx={(theme) => ({
          flexBasis: 300,
          width: "100%",
          marginRight: theme.spacing(1),
          marginTop: theme.spacing(0),
        })}
      >
        {enumKeys(LossFunction).map((k) => {
          return (
            <MenuItem key={k} value={LossFunction[k]}>
              {LossFunction[k]}
            </MenuItem>
          );
        })}
      </Select>
    </>
  );
};
