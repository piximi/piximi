import Radio from "@material-ui/core/Radio";
import React, { useState } from "react";
import { RadioGroup } from "@material-ui/core";
import FormControlLabel from "@material-ui/core/FormControlLabel";
import { ZoomType } from "../Main/Main";
import List from "@material-ui/core/List";
import ListItem from "@material-ui/core/ListItem";
import ListItemIcon from "@material-ui/core/ListItemIcon";
import ListItemText from "@material-ui/core/ListItemText";
import { SelectionType } from "../../../types/SelectionType";
import Button from "@material-ui/core/Button";

type ZoomProps = {
  zoomMode: ZoomType;
  handleChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
};

export const ZoomOptions = ({ zoomMode, handleChange }: ZoomProps) => {
  return (
    <React.Fragment>
      <List>
        <ListItem dense>
          <ListItemText primary={"Mode"} secondary={"Select the zoom mode."} />
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
        </ListItem>
        <ListItem>
          <Button variant="contained">Actual Size</Button>
        </ListItem>
      </List>
    </React.Fragment>
  );
};
