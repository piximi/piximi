import { useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Stack } from "@mui/material";

import { dataSlice } from "store/data";

import { ButtonContainer } from "views/ImageViewer/components/ButtonContainer";
import { OperationButton } from "views/ImageViewer/components/OperationButton";
import { imageViewerDataSlice } from "views/ImageViewer/state/image-viewer-data/ImageViewerDataSlice";
import { selectSelectedTracklets } from "views/ImageViewer/state/image-viewer-data/selectors";

export const TrackControls = () => {
  const dispatch = useDispatch();
  const selectedTracks = useSelector(selectSelectedTracklets);
  const canOperate = selectedTracks.length > 1;
  const handleSplit = useCallback(() => {
    if (selectedTracks.length < 2) return;
    dispatch(
      dataSlice.actions.addChildrenToTrack({
        parentId: selectedTracks[0],
        childIds: selectedTracks.slice(1),
      }),
    );
    dispatch(imageViewerDataSlice.actions.clearTrackSelection());
  }, [selectedTracks]);

  const handleUndoSplit = useCallback(() => {
    if (selectedTracks.length < 2) return;
    dispatch(
      dataSlice.actions.removeChildrenFromTrack({
        parentId: selectedTracks[0],
        childIds: selectedTracks.slice(1),
      }),
    );
    dispatch(imageViewerDataSlice.actions.clearTrackSelection());
  }, [selectedTracks]);

  const handleMerge = useCallback(() => {
    if (selectedTracks.length < 2) return;
    dispatch(
      dataSlice.actions.addParentsToTrack({
        parentIds: selectedTracks.slice(1),
        childId: selectedTracks[0],
      }),
    );
    dispatch(imageViewerDataSlice.actions.clearTrackSelection());
  }, [selectedTracks]);

  const handleUndoMerge = useCallback(() => {
    if (selectedTracks.length < 2) return;
    dispatch(
      dataSlice.actions.removeParentsFromTrack({
        parentIds: selectedTracks.slice(1),
        childId: selectedTracks[0],
      }),
    );
    dispatch(imageViewerDataSlice.actions.clearTrackSelection());
  }, [selectedTracks]);
  return (
    <Stack
      sx={{
        width: "100%",
        mx: "auto",
        alignItems: "flex-start",
        gap: 1.5,
      }}
    >
      <ButtonContainer>
        <OperationButton
          variant="text"
          onClick={handleSplit}
          disabled={!canOperate}
        >
          Create Traklet
        </OperationButton>
        <OperationButton
          variant="text"
          onClick={handleUndoSplit}
          sx={{ textWrap: "nowrap" }}
          disabled={!canOperate}
        >
          Remove Linkage
        </OperationButton>
      </ButtonContainer>
      {/* <ButtonContainer>
        <OperationButton
          variant="text"
          onClick={handleMerge}
          disabled={!canOperate}
        >
          Link Parents
        </OperationButton>
        <OperationButton
          variant="text"
          onClick={handleUndoMerge}
          sx={{ textWrap: "nowrap" }}
          disabled={!canOperate}
        >
          Unlink Parents
        </OperationButton>
      </ButtonContainer> */}
      <ButtonContainer>
        <OperationButton
          variant="text"
          onClick={handleMerge}
          disabled={!canOperate}
        >
          Join Tracks
        </OperationButton>
        <OperationButton
          variant="text"
          onClick={handleUndoMerge}
          sx={{ textWrap: "nowrap" }}
          disabled={!canOperate}
        >
          Sever Tracks
        </OperationButton>
      </ButtonContainer>
    </Stack>
  );
};
