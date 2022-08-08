import React from "react";
import { useDispatch } from "react-redux";

import { Slider, Toolbar, Box } from "@mui/material";
import {
  ZoomIn as ZoomInIcon,
  ZoomOut as ZoomOutIcon,
} from "@mui/icons-material";

import { UploadButton } from "components/main/UploadButton";
import { Logo } from "components/Application/Logo";
import { ImageSortSelection } from "components/main/ImageSortSelection/ImageSortSelection";

import { applicationSlice } from "store/slices";

export const ApplicationToolbar = () => {
  const dispatch = useDispatch();
  const [value, setValue] = React.useState<number>(1);

  const onChange = (event: Event, newValue: number | number[]) => {
    setValue(newValue as number);
    dispatch(
      applicationSlice.actions.updateTileSize({
        newValue: newValue as number,
      })
    );
  };

  return (
    <Toolbar>
      <Logo width={250} height={50} />
      {/*<TaskSelect />*/}
      <Box sx={{ flexGrow: 1 }} />

      <ImageSortSelection />
      <ZoomOutIcon
        sx={(theme) => ({
          marginLeft: theme.spacing(1),
          marginRight: theme.spacing(1),
        })}
      />
      <Slider
        value={value}
        min={0.6}
        max={4}
        step={0.1}
        onChange={onChange}
        sx={{ width: "10%" }}
      />
      <ZoomInIcon
        sx={(theme) => ({
          marginLeft: theme.spacing(1),
          marginRight: theme.spacing(1),
        })}
      />
      {/*<SearchInput />*/}
      <UploadButton />
    </Toolbar>
  );
};
