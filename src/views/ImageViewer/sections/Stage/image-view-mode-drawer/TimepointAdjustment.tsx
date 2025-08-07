import { useEffect, useMemo, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Box, IconButton, Slider, Stack } from "@mui/material";
import {
  ChevronLeft as ChevronLeftIcon,
  ChevronRight as ChevronRightIcon,
} from "@mui/icons-material";
import { imageViewerSlice } from "views/ImageViewer/state/imageViewer";
import {
  selectActiveImageSeries,
  selectStageWidth,
} from "views/ImageViewer/state/imageViewer/selectors";
import { selectActiveImage } from "views/ImageViewer/state/imageViewer/reselectors";
import { ImageViewerTimepointProperties } from "views/ImageViewer/utils/types";
import { selectImageDictionary } from "store/data/selectors";
import { createRenderedTensor } from "utils/tensorUtils";
import { annotatorSlice } from "views/ImageViewer/state/annotator";

export const TimepointAdjustment = () => {
  const dispatch = useDispatch();
  const activeImage = useSelector(selectActiveImage);
  const activeImageSeriesDetails = useSelector(selectActiveImageSeries);
  const imageSeries = useSelector(selectImageDictionary);
  const containerRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<(HTMLImageElement | null)[]>([]);

  const [tpHtmlImages, setTPHtmlImages] = useState<string[]>([]);
  const [sliderValue, setSliderValue] = useState<string>(
    activeImageSeriesDetails?.activeTimepoint ?? "0",
  );

  const tsPreviewProportions = useMemo(() => {
    const targetHeight = 75;
    return (activeImage?.shape.height ?? 75) / targetHeight;
  }, [activeImage]);

  const numTimepoints = useMemo(() => {
    if (!activeImageSeriesDetails) return 0;
    return Object.keys(activeImageSeriesDetails?.timepoints).length - 1;
  }, [activeImageSeriesDetails?.timepoints]);

  const sliderWidth = useMemo(() => {
    const tpWidth = numTimepoints * 16 + 80; // 80 is width of both side buttons;
    const containerWidth = containerRef.current?.clientWidth ?? 0;

    if (tpWidth > containerWidth && containerWidth > 0) return "100%";
    return tpWidth + "px";
  }, [numTimepoints, containerRef.current?.clientWidth]);

  const scrollToItem = (index: number) => {
    const item = itemRefs.current[index];
    if (item) {
      item.scrollIntoView({
        behavior: "smooth",
        block: "center",
        inline: "nearest",
      });
    }
  };
  const updateTimepointImage = (nextTimepoint: number) => {
    scrollToItem(nextTimepoint);
    setSliderValue(nextTimepoint + "");
    dispatch(
      imageViewerSlice.actions.setActiveImageTimepoint({
        tp: nextTimepoint + "",
      }),
    );
    dispatch(
      annotatorSlice.actions.setWorkingAnnotation({ annotation: undefined }),
    );
  };

  const handleSliderChange = (newValue: number | number[]) => {
    updateTimepointImage(newValue as number);
  };

  const handleDecrementTimepoint = () => {
    if (!activeImageSeriesDetails) return;
    const activeTimepoint = +activeImageSeriesDetails.activeTimepoint;
    const nextTimepoint = activeTimepoint !== 0 ? activeTimepoint - 1 : -1;

    if (nextTimepoint >= 0) {
      updateTimepointImage(nextTimepoint);
    }
  };
  const handleIncrementTimepoint = () => {
    if (!activeImageSeriesDetails) return;
    const activeTimepoint = +activeImageSeriesDetails.activeTimepoint;
    const maxTimepoints =
      Object.keys(activeImageSeriesDetails.timepoints).length - 1;
    const nextTimepoint =
      activeTimepoint < maxTimepoints ? activeTimepoint + 1 : undefined;
    if (nextTimepoint) {
      updateTimepointImage(nextTimepoint);
    }
  };

  useEffect(() => {
    let srcs: string[] = [];
    if (activeImageSeriesDetails)
      srcs = Object.values(activeImageSeriesDetails.timepoints).map(
        (timepoint: ImageViewerTimepointProperties) => {
          return timepoint.ZTPreview;
        },
      );
    setTPHtmlImages(srcs);
  }, [activeImageSeriesDetails]);

  return activeImage && activeImageSeriesDetails ? ( // For cleaner typescript, shouldnt be able to focus on if values undefined
    <Box
      sx={{
        display: "grid",
        gridTemplateColumns: "1fr",
        gridTemplateRows: "25px 75px",
        width: "100%",
        maxWidth: "100%",
        justifyItems: "center",
        maxHeight: "100px",
      }}
      gap={1}
    >
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: "50px 1fr 50px",
          width: sliderWidth,
          maxWidth: sliderWidth,
          justifyItems: "center",
          maxHeight: "25px",
        }}
        gap={1}
      >
        <IconButton
          sx={{ height: "25px", my: "auto" }}
          onClick={handleDecrementTimepoint}
        >
          <ChevronLeftIcon />
        </IconButton>
        <Slider
          orientation="horizontal"
          value={+sliderValue}
          min={0}
          max={numTimepoints}
          step={1}
          size={"small"}
          track={false}
          marks={true}
          onChange={(_, value) => handleSliderChange(value as number)}
          sx={{ height: "25px", my: "auto", py: 0 }}
          slotProps={{
            rail: { style: { backgroundColor: "transparent" } },
            thumb: { style: { transition: "none" } },
          }}
        />
        <IconButton
          sx={{ height: "25px", my: "auto" }}
          onClick={handleIncrementTimepoint}
        >
          <ChevronRightIcon />
        </IconButton>
      </Box>

      <Stack
        ref={containerRef}
        direction="row"
        sx={{
          overflowX: "scroll",
          flexGrow: 1,
          maxWidth: "100%",

          alignItems: "center",
        }}
        gap={1}
      >
        {Object.values(tpHtmlImages ?? []).map((timepointSrcs: string, idx) => {
          return (
            <img
              key={`tp-${idx}`}
              ref={(el) => (itemRefs.current[idx] = el)}
              style={{
                border:
                  +activeImageSeriesDetails?.activeTimepoint === idx
                    ? "2px solid pink"
                    : "2px solid transparent",
              }}
              src={timepointSrcs}
              width={`${activeImage.shape.width / tsPreviewProportions}px`}
              height={`${activeImage.shape.height / tsPreviewProportions}px`}
              onClick={() => {
                setSliderValue(idx + "");
                dispatch(
                  imageViewerSlice.actions.setActiveImageTimepoint({
                    tp: idx + "",
                  }),
                );
              }}
            />
          );
        })}
      </Stack>
    </Box>
  ) : (
    <></>
  );
};
