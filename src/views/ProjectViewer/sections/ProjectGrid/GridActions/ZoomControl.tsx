import { useLayoutEffect, useState } from "react";

import { useDispatch } from "react-redux";

import { IconButton, Popper } from "@mui/material";
import { ZoomIn as ZoomInIcon } from "@mui/icons-material";

import { useMenu, useMobileView } from "hooks";

import { HelpItem } from "components/layout/HelpDrawer/HelpContent";
import { IncrementalSlider } from "components/inputs";

import { applicationSettingsSlice } from "store/applicationSettings";

import { DEFAULT_GRID_ITEM_WIDTH, DIMENSIONS, GRID_GAP } from "utils/constants";

import { actionButtonStyle } from "./utils";

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

  const handleSizeChange = (newValue: number | number[]) => {
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
        onClick={open ? onClose : onOpen}
        sx={{ ...actionButtonStyle, mr: 0.5 }}
      >
        <ZoomInIcon />
      </IconButton>
      <Popper open={open} anchorEl={anchorEl}>
        <IncrementalSlider
          min={minZoom}
          max={maxZoom}
          orientation="vertical"
          initialValue={value}
          step={0.1}
          length={(maxZoom - minZoom) * 20 + "px"}
          outerStyle={{
            border: `1px solid var(--mui-palette-text-primary)`,
          }}
          callback={handleSizeChange}
          callbackOnSlide={true}
        />
      </Popper>
    </>
  );
};
