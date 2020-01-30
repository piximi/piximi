import * as React from "react";
import TextField from "@material-ui/core/TextField";

type MinimumDeltaProps = {};

export const MinimumDelta = ({}: MinimumDeltaProps) => {
  return (
    <TextField
      fullWidth
      id="batch-size"
      label="Minimum δ"
      onChange={() => {}}
      value={0}
    />
  );
};
