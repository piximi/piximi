import { useEffect, useMemo, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Box, IconButton, Slider, Stack } from "@mui/material";
import {
  ChevronLeft as ChevronLeftIcon,
  ChevronRight as ChevronRightIcon,
} from "@mui/icons-material";
import { annotatorSlice } from "views/ImageViewer/state/annotator";
import { selectActiveImage } from "views/ImageViewer/state/image-viewer-data/reselectors";
import { selectActiveMetadata } from "views/ImageViewer/state/image-viewer-data/selectors";
import { imageViewerDataSlice } from "views/ImageViewer/state/image-viewer-data/ImageViewerDataSlice";
import { ImageViewerMetadataDetails } from "views/ImageViewer/state/image-viewer-data/types";
import { RequireField } from "utils/types";
import { GeneralizedKindItem } from "store/data/types";

// The containing draw does not render if activeMetadata is undefined,
// and the Timepoint adjustment does not render if the metadata does not contain a timeseries
// Using these types to avoid excessive optional chaining
type TimeSeriesMetadata = Required<ImageViewerMetadataDetails>;
type TimeSeriesKindItem = RequireField<GeneralizedKindItem, "timepoint">;

export const TimepointAdjustment = () => {
  const dispatch = useDispatch();
  const activeImage = useSelector(selectActiveImage) as TimeSeriesKindItem;
  const activeMetadata = useSelector(
    selectActiveMetadata,
  ) as TimeSeriesMetadata;
  const containerRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<(HTMLImageElement | null)[]>([]);

  const [tpHtmlImages, setTPHtmlImages] = useState<
    { id: string; src: string; timepoint: number }[]
  >([]);
  const [sliderValue, setSliderValue] = useState<number>(activeImage.timepoint);

  const tsPreviewProportions = useMemo(() => {
    const targetHeight = 75;
    return activeImage.shape.height / targetHeight;
  }, [activeImage]);

  const numTimepoints = useMemo(() => {
    return Object.keys(activeMetadata.images).length - 1;
  }, [activeMetadata.images]);

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

  const setTimepointImage = (id: string) => {
    dispatch(imageViewerDataSlice.actions.setActiveImage(id));
    dispatch(
      annotatorSlice.actions.setWorkingAnnotation({ annotation: undefined }),
    );
  };
  const updateTimepointImage = (nextTimepoint: number) => {
    scrollToItem(nextTimepoint);
    setSliderValue(nextTimepoint);
    setTimepointImage(tpHtmlImages[nextTimepoint].id);
  };

  const handleSliderChange = (newValue: number | number[]) => {
    newValue = newValue as number;

    updateTimepointImage(newValue);
  };

  const handleDecrementTimepoint = () => {
    const activeTimepoint = activeImage.timepoint;
    const nextTimepoint = activeTimepoint !== 0 ? activeTimepoint - 1 : -1;

    if (nextTimepoint >= 0) {
      updateTimepointImage(nextTimepoint);
    }
  };
  const handleIncrementTimepoint = () => {
    const activeTimepoint = +activeMetadata.activeImageId;
    const maxTimepoints = Object.keys(activeMetadata.images).length - 1;
    const nextTimepoint =
      activeTimepoint < maxTimepoints ? activeTimepoint + 1 : undefined;
    if (nextTimepoint) {
      updateTimepointImage(nextTimepoint);
    }
  };

  useEffect(() => {
    const srcs = Object.values(activeMetadata.images).map((image) => {
      return {
        id: image.id,
        src: image.ZTPreview,
        timepoint: image.timepoint!,
      };
    });
    setTPHtmlImages(srcs);
  }, [activeMetadata]);

  return (
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
          value={sliderValue}
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
        {Object.values(tpHtmlImages ?? []).map((image, idx) => {
          return (
            <img
              key={`tp-${idx}`}
              ref={(el) => (itemRefs.current[idx] = el)}
              style={{
                border:
                  activeMetadata.activeImageId === image.id
                    ? "2px solid pink"
                    : "2px solid transparent",
              }}
              src={image.src}
              width={`${activeImage.shape.width / tsPreviewProportions}px`}
              height={`${activeImage.shape.height / tsPreviewProportions}px`}
              onClick={() => {
                setSliderValue(idx);
                setTimepointImage(image.id);
              }}
            />
          );
        })}
      </Stack>
    </Box>
  );
};
