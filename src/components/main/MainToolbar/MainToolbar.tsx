import React from "react";
import { useDispatch } from "react-redux";

import { Slider, Toolbar, Box, Button, Menu, MenuItem } from "@mui/material";
import {
  ZoomOut as ZoomOutIcon,
  ZoomIn as ZoomInIcon,
} from "@mui/icons-material";

import { ImageSortSelection } from "../ImageSortSelection";

import { UploadButton } from "../UploadButton";
import { Logo } from "components/Application/Logo";

import { applicationSlice } from "store/application";
import { useContextMenu } from "hooks/useContextMenu/useContextMenu";

export const MainToolbar = () => {
  const dispatch = useDispatch();
  const [value, setValue] = React.useState<number>(1);
  const minZoom = 0.6;
  const maxZoom = 4;
  const { contextMenu, handleContextMenu, closeContextMenu } = useContextMenu();
  const onChange = (event: Event, newValue: number | number[]) => {
    setValue(newValue as number);
    dispatch(
      applicationSlice.actions.updateTileSize({
        newValue: newValue as number,
      })
    );
  };

  const onZoomOut = () => {
    const newValue = value - 0.1 >= minZoom ? value - 0.1 : minZoom;
    setValue(newValue as number);
    dispatch(
      applicationSlice.actions.updateTileSize({
        newValue: newValue as number,
      })
    );
  };

  const onZoomIn = () => {
    const newValue = value + 0.1 <= maxZoom ? value + 0.1 : maxZoom;
    setValue(newValue as number);
    dispatch(
      applicationSlice.actions.updateTileSize({
        newValue: newValue as number,
      })
    );
  };

  return (
    <Toolbar>
      <div onContextMenu={handleContextMenu}>
        <Logo width={250} height={50} />
        <Menu
          open={contextMenu !== null}
          onClose={closeContextMenu}
          anchorReference="anchorPosition"
          anchorPosition={
            contextMenu !== null
              ? { top: contextMenu.mouseY, left: contextMenu.mouseX }
              : undefined
          }
        >
          <MenuItem onClick={closeContextMenu}>Copy</MenuItem>
          <MenuItem onClick={closeContextMenu}>Print</MenuItem>
          <MenuItem onClick={closeContextMenu}>Highlight</MenuItem>
          <MenuItem onClick={closeContextMenu}>Email</MenuItem>
        </Menu>
      </div>

      {/*<TaskSelect />*/}
      <Box sx={{ flexGrow: 1 }} />

      <ImageSortSelection />
      <Button onClick={onZoomOut}>
        <ZoomOutIcon
          sx={(theme) => ({
            marginLeft: theme.spacing(1),
            marginRight: theme.spacing(1),
          })}
        />
      </Button>

      <Slider
        value={value}
        min={minZoom}
        max={maxZoom}
        step={0.1}
        onChange={onChange}
        sx={{ width: "10%" }}
      />
      <Button onClick={onZoomIn}>
        <ZoomInIcon
          sx={(theme) => ({
            marginLeft: theme.spacing(1),
            marginRight: theme.spacing(1),
          })}
        />
      </Button>

      {/*<SearchInput />*/}
      <UploadButton />
    </Toolbar>
  );
};
