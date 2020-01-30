import Grid from "@material-ui/core/Grid";
import * as React from "react";
import FormControl from "@material-ui/core/FormControl";
import InputLabel from "@material-ui/core/InputLabel";
import Select from "@material-ui/core/Select";
import MenuItem from "@material-ui/core/MenuItem";
import {useStyles} from "./Method.css";

type MethodProps = {};

export const Method = ({}: MethodProps) => {
  const classes = useStyles({});

  return (
    <Grid item xs={8}>
      <FormControl className={classes.formControl}>
        <InputLabel id="method-label">Method</InputLabel>
        <Select
          labelId="method-label"
          id="method"
          value={3}
          onChange={() => {}}
          style={{width: "100%"}}
        >
          <MenuItem value={0}>Bicubic interpolation</MenuItem>
          <MenuItem value={1}>Bilinear interpolation</MenuItem>
          <MenuItem value={2}>Lanczos</MenuItem>
          <MenuItem value={3}>Nearest-neighbor interpolation</MenuItem>
          <MenuItem value={4}>Mitchell-Netravali</MenuItem>
          <MenuItem value={5}>Gaussian</MenuItem>
        </Select>
      </FormControl>
    </Grid>
  );
};
