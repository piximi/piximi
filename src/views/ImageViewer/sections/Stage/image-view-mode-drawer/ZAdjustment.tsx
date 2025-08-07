import { useMemo, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Box, IconButton, Slider } from "@mui/material";
import {
  ChevronLeft as ChevronLeftIcon,
  ChevronRight as ChevronRightIcon,
} from "@mui/icons-material";
import { imageViewerSlice } from "views/ImageViewer/state/imageViewer";
import { selectActiveImage } from "views/ImageViewer/state/imageViewer/reselectors";
import { selectActivePlane } from "views/ImageViewer/state/imageViewer/selectors";

export const ZStackSlider = () => {
  const dispatch = useDispatch();
  const activeImage = useSelector(selectActiveImage);

  if (!activeImage) return <></>;

  const activePlane = useSelector(selectActivePlane);
  const [value, setValue] = useState<number>(activePlane ?? 0);
  const containerRef = useRef<HTMLDivElement>(null);

  const maxPlanes = useMemo(() => {
    return activeImage.shape.planes - 1;
  }, [activeImage]);

  const sliderWidth = useMemo(() => {
    const tpWidth = (maxPlanes + 1) * 16 + 100; // 80 is width of both side buttons;
    const containerWidth = containerRef.current?.clientWidth ?? 0;

    if (tpWidth > containerWidth && containerWidth > 0) return "100%";
    return tpWidth;
  }, [maxPlanes, containerRef.current?.clientWidth]);

  const handleSliderChange = (newValue: number | number[]) => {
    setValue(newValue as number);
    if (typeof newValue === "number") {
      dispatch(
        imageViewerSlice.actions.setActiveImageActivePlane({
          plane: newValue,
        }),
      );
    }
  };

  const handleDecrease = () => {
    const newValue = Math.max(0, value - 1);
    setValue(newValue);
    dispatch(
      imageViewerSlice.actions.setActiveImageActivePlane({
        plane: newValue,
      }),
    );
  };

  const handleIncrease = () => {
    const newValue = Math.min(maxPlanes, value + 1);
    setValue(newValue);
    dispatch(
      imageViewerSlice.actions.setActiveImageActivePlane({
        plane: newValue,
      }),
    );
  };

  return (
    <Box
      sx={{
        display: "flex",
        width: "100%",
        maxWidth: "100%",
        justifyContent: "center",
        alignItems: "center",
        maxHeight: "100px",
      }}
      ref={containerRef}
      gap={1}
    >
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: `50px 1fr 50px`,
          width: sliderWidth + "px",
          //maxWidth: sliderWidth + "px",
          justifyItems: "center",
        }}
        gap={1}
      >
        <IconButton
          sx={{ height: "50px", my: "auto" }}
          onClick={handleDecrease}
          disabled={activePlane === 0}
        >
          <ChevronLeftIcon />
        </IconButton>
        <Slider
          orientation="horizontal"
          value={value}
          min={0}
          max={maxPlanes}
          step={1}
          size={"small"}
          track={false}
          marks={true}
          onChange={(_, value) => handleSliderChange(value as number)}
          sx={{ height: "50px", my: "auto" }}
          slotProps={{
            rail: { style: { backgroundColor: "transparent" } },
            thumb: { style: { transition: "none" } },
          }}
          disabled={maxPlanes < 1}
        />
        <IconButton
          sx={{ height: "50px", my: "auto" }}
          onClick={handleIncrease}
          disabled={activePlane === maxPlanes}
        >
          <ChevronRightIcon />
        </IconButton>
      </Box>
    </Box>
  );
};
