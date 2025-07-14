import { useEffect, useMemo, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { IconButton, Stack } from "@mui/material";
import {
  ChevronLeft as ChevronLeftIcon,
  ChevronRight as ChevronRightIcon,
} from "@mui/icons-material";
import { imageViewerSlice } from "views/ImageViewer/state/imageViewer";
import { selectActiveImageSeries } from "views/ImageViewer/state/imageViewer/selectors";
import { selectActiveImage } from "views/ImageViewer/state/imageViewer/reselectors";
import { ImageViewerTimepointProperties } from "views/ImageViewer/utils/types";

export const TimepointAdjustment = () => {
  const dispatch = useDispatch();
  const activeImage = useSelector(selectActiveImage);
  const activeImageSeriesDetails = useSelector(selectActiveImageSeries);
  const containerRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<(HTMLImageElement | null)[]>([]);

  const [tpHtmlImages, setTPHtmlImages] = useState<string[]>([]);
  const tsProportions = useMemo(() => {
    const targetWidth = 150;
    return (activeImage?.shape.width ?? 150) / targetWidth;
  }, [activeImage]);

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
  const handleDecrementTimepoint = () => {
    if (!activeImageSeriesDetails) return;
    const activeTimepoint = +activeImageSeriesDetails.activeTimepoint;
    console.log(activeTimepoint);
    const nextTimepoint = activeTimepoint !== 0 ? activeTimepoint - 1 : -1;

    if (nextTimepoint >= 0) {
      scrollToItem(nextTimepoint);
      dispatch(
        imageViewerSlice.actions.setActiveImageTimepoint({
          tp: nextTimepoint + "",
        }),
      );
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
      scrollToItem(nextTimepoint);
      dispatch(
        imageViewerSlice.actions.setActiveImageTimepoint({
          tp: nextTimepoint + "",
        }),
      );
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
    <Stack direction="row" sx={{ flexGrow: 1, maxWidth: "100%" }} gap={1}>
      <IconButton
        sx={{ height: "50px", my: "auto" }}
        onClick={handleDecrementTimepoint}
      >
        <ChevronLeftIcon />
      </IconButton>
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
              width={`${activeImage.shape.width / tsProportions}px`}
              height={`${activeImage.shape.height / tsProportions}px`}
              onClick={() =>
                dispatch(
                  imageViewerSlice.actions.setActiveImageTimepoint({
                    tp: idx + "",
                  }),
                )
              }
            />
          );
        })}
      </Stack>
      <IconButton
        sx={{ height: "50px", my: "auto" }}
        onClick={handleIncrementTimepoint}
      >
        <ChevronRightIcon />
      </IconButton>
    </Stack>
  ) : (
    <></>
  );
};
