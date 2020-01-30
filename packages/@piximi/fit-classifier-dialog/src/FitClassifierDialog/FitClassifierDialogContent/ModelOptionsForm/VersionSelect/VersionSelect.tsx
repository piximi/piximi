import FormControl from "@material-ui/core/FormControl";
import FormHelperText from "@material-ui/core/FormHelperText";
import InputLabel from "@material-ui/core/InputLabel";
import MenuItem from "@material-ui/core/MenuItem";
import Select from "@material-ui/core/Select";
import * as React from "react";

import {useStyles} from "./VersionSelect.css";

type VersionProps = {};

export const VersionSelect = ({}: VersionProps) => {
  const classes = useStyles({});

  const onChange = () => {};

  return (
    <FormControl className={classes.formControl}>
      <InputLabel id="architecture-label">Version</InputLabel>

      <Select
        id="architecture"
        labelId="architecture-label"
        onChange={onChange}
        value={2}
      >
        <MenuItem key={1} value={1}>
          1
        </MenuItem>

        <MenuItem key={2} value={2}>
          2
        </MenuItem>
      </Select>

      <FormHelperText>&nbsp;</FormHelperText>
    </FormControl>
  );
};
