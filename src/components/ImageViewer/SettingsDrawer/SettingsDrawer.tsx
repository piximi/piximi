import React from "react";
import { Image } from "../../../types/Image";
import { useStyles } from "./SettingsDrawer.css";
import Divider from "@material-ui/core/Divider";
import Typography from "@material-ui/core/Typography";
import Drawer from "@material-ui/core/Drawer";
import FormControlLabel from "@material-ui/core/FormControlLabel";
import RadioGroup from "@material-ui/core/RadioGroup";
import Radio from "@material-ui/core/Radio";
import Button from "@material-ui/core/Button";
import { SelectionType } from "../../../types/SelectionType";

type OptionsDrawerProps = {
  data: Image;
};

export const SettingsDrawer = ({ data }: OptionsDrawerProps) => {
  const classes = useStyles();

  return (
    <Drawer
      anchor="right"
      className={classes.drawer}
      classes={{ paper: classes.drawerPaper }}
      variant="permanent"
    >
      <div className={classes.toolbar} />

      <Divider />

      <Typography>Rectangular selection</Typography>

      <RadioGroup value="new">
        <FormControlLabel
          control={<Radio />}
          disabled
          label={SelectionType.New}
          value={SelectionType.New}
        />
        <FormControlLabel
          control={<Radio />}
          disabled
          label={SelectionType.Addition}
          value={SelectionType.Addition}
        />
        <FormControlLabel
          control={<Radio />}
          disabled
          label={SelectionType.Subtraction}
          value={SelectionType.Subtraction}
        />
        <FormControlLabel
          control={<Radio />}
          disabled
          label={SelectionType.Intersection}
          value={SelectionType.Intersection}
        />
      </RadioGroup>

      <Button variant="contained">Invert</Button>
    </Drawer>
  );
};
