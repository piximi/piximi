import * as React from "react";
import {FormControl} from "@material-ui/core";
import InputLabel from "@material-ui/core/InputLabel";
import Select from "@material-ui/core/Select";
import MenuItem from "@material-ui/core/MenuItem";

type MonitorProps = {};

export const Monitor = ({}: MonitorProps) => {
  return (
    <FormControl fullWidth>
      <InputLabel id="monitor-label">Monitor</InputLabel>
      <Select
        id="monitor"
        labelId="monitor-label"
        onChange={() => {}}
        value="automatic"
      >
        <MenuItem value="automatic">Automatic</MenuItem>
        <MenuItem value="maximum">Maximum</MenuItem>
        <MenuItem value="minimum">Minimum</MenuItem>
      </Select>
    </FormControl>
  );
};
