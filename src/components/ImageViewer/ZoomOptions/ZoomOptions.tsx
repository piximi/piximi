import Radio from "@material-ui/core/Radio";
import React from "react";
import { RadioGroup } from "@material-ui/core";
import FormControlLabel from "@material-ui/core/FormControlLabel";

export const ZoomOptions = () => {
  return (
    <React.Fragment>
      <RadioGroup defaultValue="zoom in" name="zoom-mode">
        <FormControlLabel
          value="zoom in"
          control={<Radio tabIndex={-1} />}
          label="Zoom In"
        />
        <FormControlLabel
          value="zoom out"
          control={<Radio tabIndex={-1} />}
          label="Zoom out"
        />
      </RadioGroup>
    </React.Fragment>
  );
};
