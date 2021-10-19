import React, { ReactElement } from "react";
import { useStyles } from "./ImageProcessingDrawer.css";
import {
  Divider,
  Drawer,
  Grid,
  Input,
  Slider,
  Typography,
} from "@mui/material";
import { VolumeUp } from "@mui/icons-material";

type SliderWithInputFieldProps = {
  icon: ReactElement;
  name: string;
};

const SliderWithInputField = ({ icon, name }: SliderWithInputFieldProps) => {
  const classes = useStyles();

  const [value, setValue] = React.useState<
    number | string | Array<number | string>
  >(30);

  const onBlur = () => {
    if (value < 0) {
      setValue(0);
    } else if (value > 100) {
      setValue(100);
    }
  };

  const onInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setValue(event.target.value === "" ? "" : Number(event.target.value));
  };

  const onSliderChange = (event: any, newValue: number | number[]) => {
    setValue(newValue);
  };

  return (
    <div className={classes.slider}>
      <Typography id="input-slider" gutterBottom>
        {name}
      </Typography>
      <Grid container spacing={2} alignItems="center">
        <Grid item>{icon}</Grid>
        <Grid item xs>
          <Slider
            value={typeof value === "number" ? value : 0}
            onChange={onSliderChange}
            aria-labelledby="input-slider"
          />
        </Grid>
        <Grid item>
          <Input
            className={classes.sliderInput}
            value={value}
            margin="dense"
            onChange={onInputChange}
            onBlur={onBlur}
            inputProps={{
              step: 10,
              min: 0,
              max: 100,
              type: "number",
              "aria-labelledby": "input-slider",
            }}
          />
        </Grid>
      </Grid>
    </div>
  );
};

export const ImageProcessingDrawer = () => {
  const classes = useStyles();

  return (
    <Drawer
      anchor="right"
      className={classes.drawer}
      classes={{ paper: classes.drawerPaper }}
      variant="permanent"
    >
      <div className={classes.drawerHeader} />
      <Divider />
      <SliderWithInputField icon={<VolumeUp />} name="Brightness" />
    </Drawer>
  );
};
