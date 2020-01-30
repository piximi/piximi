import FormControl from "@material-ui/core/FormControl";
import FormHelperText from "@material-ui/core/FormHelperText";
import InputLabel from "@material-ui/core/InputLabel";
import MenuItem from "@material-ui/core/MenuItem";
import Select from "@material-ui/core/Select";
import * as React from "react";

import {useStyles} from "./InputShape.css";

type InputShapeProps = {};

export const InputShape = ({}: InputShapeProps) => {
  const classes = useStyles({});

  const onChange = () => {};

  return (
    <FormControl className={classes.formControl}>
      <InputLabel id="architecture-label">Input shape</InputLabel>

      <Select
        id="architecture"
        labelId="architecture-label"
        onChange={onChange}
        value={2}
      >
        <MenuItem key={1} value={1}>
          96 × 96 × 3
        </MenuItem>

        <MenuItem key={1} value={1}>
          128 × 128 × 3
        </MenuItem>

        <MenuItem key={1} value={1}>
          160 × 160 × 3
        </MenuItem>

        <MenuItem key={1} value={1}>
          192 × 192 × 3
        </MenuItem>

        <MenuItem key={2} value={2}>
          224 × 224 × 3
        </MenuItem>
      </Select>

      <FormHelperText>&nbsp;</FormHelperText>
    </FormControl>
  );
};
