import {
  FormControl,
  FormHelperText,
  MenuItem,
  Select,
  SelectChangeEvent,
} from "@mui/material";
import * as _ from "lodash";
import * as React from "react";
import { useDispatch, useSelector } from "react-redux";
import { classifierSlice } from "../../../../store/slices";
import { architectureOptionsSelector } from "../../../../store/selectors/architectureOptionsSelector";

const modelArchitecture = {
  MnistCNN: "MnistCNN",
  ResNet: "ResNet",
};

export const ArchitectureSettingsGrid = () => {
  const architectureOptions = useSelector(architectureOptionsSelector);

  const dispatch = useDispatch();

  const [modelName, setModelName] = React.useState<string>(
    architectureOptions.modelName
  );

  const handleChange = (event: SelectChangeEvent) => {
    const target = event.target as HTMLInputElement;

    setModelName(target.value);
    dispatch(
      classifierSlice.actions.updateModelName({ modelName: target.value })
    );
  };

  return (
    <>
      <FormControl sx={{ m: 1, minWidth: 120 }}>
        <Select
          value={modelName}
          onChange={handleChange}
          displayEmpty
          inputProps={{ "aria-label": "Without label" }}
        >
          <MenuItem value="None">
            <em>None</em>
          </MenuItem>
          {_.map(modelArchitecture, (v, k) => {
            return (
              <MenuItem key={k} value={k}>
                {v}
              </MenuItem>
            );
          })}
        </Select>
        <FormHelperText>Architecture</FormHelperText>
      </FormControl>
    </>
  );
};
