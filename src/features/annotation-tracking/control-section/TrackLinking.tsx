import { useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Stack } from "@mui/material";

import { dataSlice } from "store/data";

import { ButtonContainer } from "views/ImageViewer/components/ButtonContainer";
import { OperationButton } from "views/ImageViewer/components/OperationButton";
import { selectSelectedTrackletIds } from "views/ImageViewer/state/tracklet-editing/selectors";
import { trackEditingSlice } from "views/ImageViewer/state/tracklet-editing/trackletEditingSlice";

export const TrackControls = () => {
  const dispatch = useDispatch();
  const selectedTracks = useSelector(selectSelectedTrackletIds);
  const canOperate = selectedTracks.length > 1;
  const handleSplit = useCallback(() => {
    if (selectedTracks.length < 2) return;
    dispatch(
      dataSlice.actions.addChildrenToTracklet({
        parentId: selectedTracks[0],
        childIds: selectedTracks.slice(1),
      }),
    );
    dispatch(trackEditingSlice.actions.clearTrackletSelection());
  }, [selectedTracks]);

  const handleUndoSplit = useCallback(() => {
    if (selectedTracks.length < 2) return;
    dispatch(
      dataSlice.actions.removeChildrenFromTracklet({
        parentId: selectedTracks[0],
        childIds: selectedTracks.slice(1),
      }),
    );
    dispatch(trackEditingSlice.actions.clearTrackletSelection());
  }, [selectedTracks]);

  const handleMerge = useCallback(() => {
    if (selectedTracks.length < 2) return;
    dispatch(
      dataSlice.actions.addParentsToTracklet({
        parentIds: selectedTracks.slice(1),
        childId: selectedTracks[0],
      }),
    );
    dispatch(trackEditingSlice.actions.clearTrackletSelection());
  }, [selectedTracks]);

  const handleUndoMerge = useCallback(() => {
    if (selectedTracks.length < 2) return;
    dispatch(
      dataSlice.actions.removeParentsFromTracklet({
        parentIds: selectedTracks.slice(1),
        childId: selectedTracks[0],
      }),
    );
    dispatch(trackEditingSlice.actions.clearTrackletSelection());
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
