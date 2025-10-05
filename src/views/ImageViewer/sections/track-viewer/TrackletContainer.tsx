import {
  Box,
  BoxProps,
  Button,
  ButtonProps,
  Stack,
  styled,
} from "@mui/material";
import { useMobileView } from "hooks";
import React, {
  CSSProperties,
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useState,
} from "react";
import { useDispatch, useSelector } from "react-redux";
import { dataSlice } from "store/data";
import { selectTrackletRecord } from "store/data/selectors";
import { DIMENSIONS } from "utils/constants";
import { selectActiveMetadata } from "views/ImageViewer/state/image-viewer-data/selectors";
import {
  useSelectedTracklets,
  useTrackOperations,
} from "views/ImageViewer/state/TrackletContext";
import { TrackVisualizer } from "views/ImageViewer/sections/track-viewer/TrackVizualizer";

export const TrackletContainer = ({
  height,
  width,
}: {
  height: number;
  width: number;
}) => {
  const tracklets = useSelector(selectTrackletRecord);
  const activeMetadata = useSelector(selectActiveMetadata);
  const { primaryTrack, secondaryTracks, setPrimaryTrack, setSecondaryTracks } =
    useSelectedTracklets();
  const [trackViewerWidth, setTrackViewerWidth] = useState<number>(
    window.innerWidth -
      DIMENSIONS.leftDrawerWidth -
      DIMENSIONS.toolDrawerWidth * 2 -
      32,
  );

  const isMobile = useMobileView();

  useLayoutEffect(() => {
    const resizeHandler = () => {
      setTrackViewerWidth(
        window.innerWidth -
          (isMobile
            ? DIMENSIONS.toolDrawerWidth
            : DIMENSIONS.toolDrawerWidth + DIMENSIONS.leftDrawerWidth) -
          DIMENSIONS.toolDrawerWidth -
          32,
      );
    };
    window.addEventListener("resize", resizeHandler);
    return () => {
      window.removeEventListener("resize", resizeHandler);
    };
  }, [isMobile]);

  const numTimepoints = useMemo(() => {
    if (activeMetadata) return Object.keys(activeMetadata.images).length;
    return 1;
  }, [activeMetadata?.id]);

  useEffect(() => {
    console.log("track: ", width);
  }, [width]);

  return (
    <TrackVisualizer
      tracks={Object.values(tracklets)}
      width={width}
      height={height}
      numFrames={numTimepoints}
      primaryTrack={primaryTrack}
      secondaryTracks={secondaryTracks}
      setPrimaryTrack={setPrimaryTrack}
      setSecondaryTracks={setSecondaryTracks}
    />
  );
};
