import { useLayoutEffect, useState } from "react";

import { useDispatch } from "react-redux";

import { ZoomIn as ZoomInIcon } from "@mui/icons-material";

import { useMobileView } from "hooks";

import { IncrementalSlider, PopperToolButton } from "components/inputs";

import { applicationSettingsSlice } from "store/applicationSettings";

import { DEFAULT_GRID_ITEM_WIDTH, DIMENSIONS, GRID_GAP } from "utils/constants";

import { HelpItem } from "data/help/HelpContent";

const minZoom = 0.6;

export const ZoomControl = () => {
  const dispatch = useDispatch();
  const [value, setValue] = useState<number>(1);
  const [maxZoom, setMaxZoom] = useState<number>(4);
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
      <PopperToolButton
        name="Grid Zoom"
        data-help={HelpItem.GridZoom}
        onClick={() => {}}
        icon={<ZoomInIcon />}
        popperContent={
          <IncrementalSlider
            min={minZoom}
            max={maxZoom}
            orientation="vertical"
            initialValue={value}
            step={0.1}
            length={(maxZoom - minZoom) * 20 + "px"}
            outerStyle={{
              border: "1px solid var(--mui-palette-text-primary)",
            }}
            callback={handleSizeChange}
            callbackOnSlide={true}
          />
        }
        popperPlacement="bottom"
      />
    </>
  );
};
