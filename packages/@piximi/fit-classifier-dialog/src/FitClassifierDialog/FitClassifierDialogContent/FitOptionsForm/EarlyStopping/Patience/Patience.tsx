import * as React from "react";
import TextField from "@material-ui/core/TextField";

type PatienceProps = {};

export const Patience = ({}: PatienceProps) => {
  return (
    <TextField
      fullWidth
      id="patience"
      label="Patience"
      onChange={() => {}}
      value={0}
    />
  );
};
