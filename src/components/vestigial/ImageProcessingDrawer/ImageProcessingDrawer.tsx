import React, { ReactElement } from "react";

import {
  Divider,
  Drawer,
  Grid,
  Input,
  Slider,
  Typography,
  Box,
} from "@mui/material";

import { VolumeUp } from "@mui/icons-material";

type SliderWithInputFieldProps = {
  icon: ReactElement;
  name: string;
};

const SliderWithInputField = ({ icon, name }: SliderWithInputFieldProps) => {
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
    <Box
      sx={{
        padding: (theme) => theme.spacing(3),
      }}
    >
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
            sx={{ width: 42 }}
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
    </Box>
  );
};

export const ImageProcessingDrawer = () => {
  return (
    <Drawer
      anchor="right"
      sx={{
        flexShrink: 0,
        width: (theme) => theme.spacing(32),
        "& > .MuiDrawer-paper": {
          width: (theme) => theme.spacing(32),
          zIndex: 0,
        },
      }}
      variant="permanent"
    >
      <Box
        sx={(theme) => ({
          ...theme.mixins.toolbar,
          alignItems: "center",
          display: "flex",
          paddingLeft: theme.spacing(3),
        })}
      />
      <Divider />
      <SliderWithInputField icon={<VolumeUp />} name="Brightness" />
    </Drawer>
  );
};
