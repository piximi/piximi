import FormControl from "@material-ui/core/FormControl";
import FormHelperText from "@material-ui/core/FormHelperText";
import InputLabel from "@material-ui/core/InputLabel";
import MenuItem from "@material-ui/core/MenuItem";
import Select from "@material-ui/core/Select";
import * as React from "react";

import {useStyles} from "./Multiplier.css";

type MultiplierProps = {};

export const Multiplier = ({}: MultiplierProps) => {
  const classes = useStyles({});

  const onChange = () => {};

  return (
    <FormControl className={classes.formControl}>
      <InputLabel id="architecture-label">Multiplier</InputLabel>

      <Select
        id="architecture"
        labelId="architecture-label"
        onChange={onChange}
        value={2}
      >
        <MenuItem key={1} value={1}>
          1.0
        </MenuItem>

        <MenuItem key={2} value={2}>
          1.3
        </MenuItem>
      </Select>

      <FormHelperText>&nbsp;</FormHelperText>
    </FormControl>
  );
};
