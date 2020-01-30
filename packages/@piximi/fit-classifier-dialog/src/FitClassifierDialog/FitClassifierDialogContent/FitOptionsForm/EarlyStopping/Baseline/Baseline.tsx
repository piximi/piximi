import * as React from "react";
import TextField from "@material-ui/core/TextField";

type BaselineProps = {};

export const Baseline = ({}: BaselineProps) => {
  return (
    <TextField
      disabled
      fullWidth
      id="baseline"
      label="Baseline"
      onChange={() => {}}
      value={0}
    />
  );
};
