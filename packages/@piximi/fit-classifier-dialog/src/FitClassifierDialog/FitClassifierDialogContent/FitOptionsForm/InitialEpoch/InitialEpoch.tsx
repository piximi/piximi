import Grid from "@material-ui/core/Grid";
import * as React from "react";
import TextField from "@material-ui/core/TextField";

type InitialEpochProps = {};

export const InitialEpoch = ({}: InitialEpochProps) => {
  return (
    <TextField
      fullWidth
      id="initial-epoch"
      label="Initial epoch"
      onChange={() => {}}
      value={1}
    />
  );
};
