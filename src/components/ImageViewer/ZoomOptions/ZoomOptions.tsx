import Radio from "@material-ui/core/Radio";
import React, { useState } from "react";
import { RadioGroup } from "@material-ui/core";
import FormControlLabel from "@material-ui/core/FormControlLabel";
import { ZoomType } from "../Main/Main";

type ZoomProps = {
  zoomMode: ZoomType;
  handleChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
};

export const ZoomOptions = ({ zoomMode, handleChange }: ZoomProps) => {
  return (
    <React.Fragment>
      <RadioGroup
        defaultValue="zoom in"
        name="zoom-mode"
        value={zoomMode}
        onChange={handleChange}
      >
        <FormControlLabel
          value={ZoomType.In}
          control={<Radio tabIndex={-1} />}
          label="Zoom In"
        />
        <FormControlLabel
          value={ZoomType.Out}
          control={<Radio tabIndex={-1} />}
          label="Zoom out"
        />
      </RadioGroup>
    </React.Fragment>
  );
};
