import FormControl from "@material-ui/core/FormControl";
import FormHelperText from "@material-ui/core/FormHelperText";
import InputLabel from "@material-ui/core/InputLabel";
import MenuItem from "@material-ui/core/MenuItem";
import Select from "@material-ui/core/Select";
import * as React from "react";

import {useStyles} from "./Architecture.css";

type ArchitectureProps = {};

export const Architecture = ({}: ArchitectureProps) => {
  const classes = useStyles({});

  const onChange = () => {};

  return (
    <FormControl className={classes.formControl}>
      <InputLabel id="architecture-label">Architecture</InputLabel>

      <Select
        id="architecture"
        labelId="architecture-label"
        onChange={onChange}
        value={1}
      >
        <MenuItem key={1} value={1}>
          MobileNet
        </MenuItem>
      </Select>

      <FormHelperText>&nbsp;</FormHelperText>
    </FormControl>
  );
};
