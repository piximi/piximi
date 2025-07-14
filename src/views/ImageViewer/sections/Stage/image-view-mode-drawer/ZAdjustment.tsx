import { useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Box, IconButton, Slider } from "@mui/material";
import {
  ChevronLeft as ChevronLeftIcon,
  ChevronRight as ChevronRightIcon,
} from "@mui/icons-material";
import { imageViewerSlice } from "views/ImageViewer/state/imageViewer";
import { selectActiveImage } from "views/ImageViewer/state/imageViewer/reselectors";

export const ZStackSlider = () => {
  const dispatch = useDispatch();
  const activeImage = useSelector(selectActiveImage);
  const [value, setValue] = useState<number>(activeImage?.activePlane ?? 0);

  const zStackLimits = useMemo(() => {
    if (!activeImage) return { min: 0, max: 0, step: 1, initial: 0 };
    return {
      min: 0,
      max: activeImage.shape.planes - 1,
      step: 1,
      initial: activeImage.activePlane,
    };
  }, [activeImage]);
  const zStackCallback = async (newValue: number | number[]) => {
    if (typeof newValue === "number") {
      dispatch(
        imageViewerSlice.actions.setActiveImageActivePlane({ plane: newValue }),
      );
    }
  };

  const handleSliderChange = (newValue: number | number[]) => {
    setValue(newValue as number);
    //zStackCallback(newValue as number);
  };

  const handleDecrease = () => {
    const newValue = Math.max(zStackLimits.min, value - 1);
    setValue(newValue);
    zStackCallback(newValue);
  };

  const handleIncrease = () => {
    const newValue = Math.min(zStackLimits.max, value + 1);
    setValue(newValue);
    zStackCallback(newValue);
  };

  return activeImage ? (
    <Box
      sx={{
        display: "grid",
        gridTemplateColumns: "50px 1fr 50px",
        width: "100%",
        maxWidth: "100%",
        justifyItems: "center",
      }}
      gap={1}
    >
      <IconButton sx={{ height: "50px", my: "auto" }} onClick={handleDecrease}>
        <ChevronLeftIcon />
      </IconButton>
      <Slider
        orientation="horizontal"
        value={value}
        min={0}
        max={100} //activeImage.shape.planes - 1}
        step={1}
        size={"small"}
        track={false}
        marks={true}
        onChange={(_, value) => handleSliderChange(value as number)}
        sx={{ height: "50px", my: "auto" }}
        slotProps={{ rail: { style: { backgroundColor: "transparent" } } }}
      />
      <IconButton sx={{ height: "50px", my: "auto" }} onClick={handleIncrease}>
        <ChevronRightIcon />
      </IconButton>
    </Box>
  ) : (
    <></>
  );
};
