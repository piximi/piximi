import React, { useCallback, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";

import { selectTrackletRecord } from "store/data/selectors";

import { imageViewerDataSlice } from "views/ImageViewer/state/image-viewer-data/ImageViewerDataSlice";
import {
  selectActiveMetadata,
  selectSelectedTracklets,
} from "views/ImageViewer/state/image-viewer-data/selectors";
import { TrackVisualizer } from "./TrackVizualizer";

export const TrackletContainer = ({
  height,
  width,
}: {
  height: number;
  width: number;
}) => {
  const dispatch = useDispatch();
  const tracklets = useSelector(selectTrackletRecord);
  const activeMetadata = useSelector(selectActiveMetadata);
  const secondaryTracks = useSelector(selectSelectedTracklets);

  const handleToggleSelectedTrack = useCallback(
    (trackId: string) =>
      dispatch(imageViewerDataSlice.actions.toggleSelectedTrack(trackId)),
    [],
  );

  const numTimepoints = useMemo(() => {
    if (activeMetadata) return Object.keys(activeMetadata.images).length;
    return 1;
  }, [activeMetadata?.id]);

  return (
    <TrackVisualizer
      tracks={Object.values(tracklets)}
      width={width}
      height={height}
      numFrames={numTimepoints}
      selectedTracks={secondaryTracks}
      toggleSelectedTrack={handleToggleSelectedTrack}
    />
  );
};
