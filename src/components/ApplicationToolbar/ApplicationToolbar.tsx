import React from "react";
import { UploadButton } from "../UploadButton";
import { Logo } from "../Logo";
import { applicationSlice } from "../../store/slices";
import { useDispatch } from "react-redux";
import { Slider, Toolbar, Box } from "@mui/material";
import ZoomOutIcon from "@mui/icons-material/ZoomOut";
import ZoomInIcon from "@mui/icons-material/ZoomIn";
import { ImageSortSelection } from "components/ImageSortSelection/ImageSortSelection";

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
