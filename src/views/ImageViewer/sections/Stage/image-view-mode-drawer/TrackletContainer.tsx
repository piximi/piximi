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
import { TrackVisualizer } from "views/TrackViewer";

const OperationButton = styled(Button)<ButtonProps>(() => ({
  justifyContent: "flex-start",
  minWidth: 0,
}));

const ButtonBox = styled(Box)<BoxProps>(() => ({
  display: "flex",
  justifyContent: "space-between",
  width: "100%",
}));
export const TrackletContainer = () => {
  const dispatch = useDispatch();
  const tracklets = useSelector(selectTrackletRecord);
  const activeMetadata = useSelector(selectActiveMetadata);
  const [primaryTrack, setPrimaryTrack] = useState<string>();
  const [secondaryTracks, setSecondaryTracks] = useState<string[]>([]);
  const [trackViewerWidth, setTrackViewerWidth] = useState<number>(
    (window.innerWidth -
      DIMENSIONS.leftDrawerWidth -
      DIMENSIONS.toolDrawerWidth * 2 -
      32) *
      0.7,
  );
  const isMobile = useMobileView();
  useLayoutEffect(() => {
    const resizeHandler = () => {
      setTrackViewerWidth(
        (window.innerWidth -
          (isMobile
            ? DIMENSIONS.toolDrawerWidth
            : DIMENSIONS.toolDrawerWidth + DIMENSIONS.leftDrawerWidth) -
          DIMENSIONS.toolDrawerWidth -
          32) *
          0.7,
      );
    };
    window.addEventListener("resize", resizeHandler);
    return () => {
      window.removeEventListener("resize", resizeHandler);
    };
  }, [isMobile]);

  const canOperate = useMemo(
    () => primaryTrack && secondaryTracks.length > 0,
    [primaryTrack, secondaryTracks],
  );

  const numTimepoints = useMemo(() => {
    if (activeMetadata) return Object.keys(activeMetadata.images).length;
    return 1;
  }, [activeMetadata?.id]);

  const clearSelectedTracks = useCallback(() => {
    setPrimaryTrack(undefined);
    setSecondaryTracks([]);
  }, []);
  const handleSplit = () => {
    if (!primaryTrack || secondaryTracks.length === 0) return;
    dispatch(
      dataSlice.actions.addChildrenToTrack({
        parentId: primaryTrack,
        childIds: secondaryTracks,
      }),
    );
    clearSelectedTracks();
  };
  const handleUndoSplit = () => {
    if (!primaryTrack || secondaryTracks.length === 0) return;
    dispatch(
      dataSlice.actions.removeChildrenFromTrack({
        parentId: primaryTrack,
        childIds: secondaryTracks,
      }),
    );
    clearSelectedTracks();
  };

  const handleMerge = () => {
    if (!primaryTrack || secondaryTracks.length === 0) return;
    dispatch(
      dataSlice.actions.addParentsToTrack({
        parentIds: secondaryTracks,
        childId: primaryTrack,
      }),
    );
    clearSelectedTracks();
  };
  const handleUndoMerge = () => {
    if (!primaryTrack || secondaryTracks.length === 0) return;
    dispatch(
      dataSlice.actions.removeParentsFromTrack({
        parentIds: secondaryTracks,
        childId: primaryTrack,
      }),
    );
    clearSelectedTracks();
  };

  useEffect(() => {
    console.log("primaryTracklet: ", primaryTrack);
    console.log("secondaryTracklets: ", secondaryTracks);
  }, [primaryTrack, secondaryTracks]);

  return (
    <Box sx={{ display: "flex", width: "100%", pl: "15%" }}>
      <TrackVisualizer
        tracks={Object.values(tracklets)}
        width={trackViewerWidth}
        numFrames={numTimepoints}
        primaryTrack={primaryTrack}
        secondaryTracks={secondaryTracks}
        setPrimaryTrack={setPrimaryTrack}
        setSecondaryTracks={setSecondaryTracks}
      />
      <Stack sx={{ flexGrow: 1, px: 1, alignItems: "center" }}>
        <ButtonBox>
          <OperationButton
            variant="text"
            onClick={handleSplit}
            disabled={!canOperate}
          >
            Split
          </OperationButton>
          <OperationButton
            variant="text"
            onClick={handleUndoSplit}
            sx={{ textWrap: "nowrap" }}
            disabled={!canOperate}
          >
            Undo Split
          </OperationButton>
        </ButtonBox>
        <ButtonBox>
          <OperationButton
            variant="text"
            onClick={handleMerge}
            disabled={!canOperate}
          >
            Merge
          </OperationButton>
          <OperationButton
            variant="text"
            onClick={handleUndoMerge}
            sx={{ textWrap: "nowrap" }}
            disabled={!canOperate}
          >
            Undo Merge
          </OperationButton>
        </ButtonBox>
        <OperationButton
          variant="text"
          onClick={clearSelectedTracks}
          disabled={!primaryTrack && secondaryTracks.length === 0}
        >
          Clear Selection
        </OperationButton>
      </Stack>
    </Box>
  );
};
