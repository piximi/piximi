import { useLayoutEffect, useState } from "react";
import { useDispatch } from "react-redux";
import { Box, IconButton, Menu, Slider } from "@mui/material";
import {
  ZoomIn as ZoomInIcon,
  Add as AddIcon,
  Remove as RemoveIcon,
} from "@mui/icons-material";
import { useMenu, useMobileView } from "hooks";
import { applicationSettingsSlice } from "store/applicationSettings";
import { HelpItem } from "components/layout/HelpDrawer/HelpContent";
import { DEFAULT_GRID_ITEM_WIDTH, DIMENSIONS, GRID_GAP } from "utils/constants";

const minZoom = 0.6;

export const ZoomControl = () => {
  const dispatch = useDispatch();
  const [value, setValue] = useState<number>(1);
  const [maxZoom, setMaxZoom] = useState<number>(4);
  const { onOpen, onClose, open, anchorEl } = useMenu();
  const isMobile = useMobileView();

  useLayoutEffect(() => {
    const resizeHandler = () => {
      const gridWidth = !isMobile
        ? window.innerWidth -
          DIMENSIONS.leftDrawerWidth -
          DIMENSIONS.toolDrawerWidth -
          GRID_GAP
        : window.innerWidth - DIMENSIONS.toolDrawerWidth - GRID_GAP;
      setMaxZoom(gridWidth / DEFAULT_GRID_ITEM_WIDTH);
    };
    window.addEventListener("resize", resizeHandler);
    return () => {
      window.removeEventListener("resize", resizeHandler);
    };
  }, [isMobile]);

  const handleSizeChange = (event: Event, newValue: number | number[]) => {
    setValue(newValue as number);
    dispatch(
      applicationSettingsSlice.actions.updateTileSize({
        newValue: newValue as number,
      }),
    );
  };

  const onZoomOut = () => {
    const newValue = value - 0.1 >= minZoom ? value - 0.1 : minZoom;
    setValue(newValue as number);
    dispatch(
      applicationSettingsSlice.actions.updateTileSize({
        newValue: newValue as number,
      }),
    );
  };

  const onZoomIn = () => {
    const newValue = value + 0.1 <= maxZoom ? value + 0.1 : maxZoom;
    setValue(newValue as number);
    dispatch(
      applicationSettingsSlice.actions.updateTileSize({
        newValue: newValue as number,
      }),
    );
  };

  return (
    <>
      <IconButton
        data-help={HelpItem.GridZoom}
        color="inherit"
        onClick={onOpen}
      >
        <ZoomInIcon />
      </IconButton>
      <Menu anchorEl={anchorEl} open={open} onClose={onClose}>
        <Box display="flex" flexDirection="column" alignItems="center">
          <AddIcon onClick={onZoomIn} />
          <Slider
            orientation="vertical"
            value={value}
            min={minZoom}
            max={maxZoom}
            step={0.1}
            onChange={handleSizeChange}
            sx={{ height: (maxZoom - minZoom) * 20 + "px", my: 1, mr: 0 }}
          />
          <RemoveIcon onClick={onZoomOut} />
        </Box>
      </Menu>
    </>
  );
};
