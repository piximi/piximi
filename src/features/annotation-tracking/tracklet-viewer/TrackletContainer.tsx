import React, { useCallback, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";

import { selectActiveMetadata } from "views/ImageViewer/state/image-viewer-data/selectors";
import { TrackVisualizer } from "./TrackVizualizer";
import { selectPendingTrackletEntities } from "views/ImageViewer/state/tracklet-editing/reselectors";
import { selectSelectedTrackletIds } from "views/ImageViewer/state/tracklet-editing/selectors";
import { trackEditingSlice } from "views/ImageViewer/state/tracklet-editing/trackletEditingSlice";

export const TrackletContainer = ({
  height,
  width,
}: {
  height: number;
  width: number;
}) => {
  const dispatch = useDispatch();
  const tracklets = useSelector(selectPendingTrackletEntities);
  const activeMetadata = useSelector(selectActiveMetadata);
  const secondaryTracks = useSelector(selectSelectedTrackletIds);

  const handleToggleSelectedTrack = useCallback(
    (trackId: string) =>
      dispatch(trackEditingSlice.actions.toggleSelectedTracklet(trackId)),
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
