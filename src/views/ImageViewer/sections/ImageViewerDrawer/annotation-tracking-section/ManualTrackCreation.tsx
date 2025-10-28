import { Box, Stack } from "@mui/material";
import { useDispatch, useSelector } from "react-redux";
import { dataSlice } from "store/data";
import { generateUUID } from "store/data/utils";
import { getRandomHexColor } from "utils/colorUtils";
import { ButtonContainer } from "views/ImageViewer/components/ButtonContainer";
import { OperationButton } from "views/ImageViewer/components/OperationButton";
import { imageViewerDataSlice } from "views/ImageViewer/state/image-viewer-data/ImageViewerDataSlice";
import {
  selectActiveMetadataId,
  selectActiveTrackId,
  selectSelectedTracklets,
  selectTimeLinkingState,
} from "views/ImageViewer/state/image-viewer-data/selectors";

export const ManualTrackCreation = () => {
  const dispatch = useDispatch();
  const active = useSelector(selectTimeLinkingState);
  const activeTrackId = useSelector(selectActiveTrackId);
  const activeMetadataId = useSelector(selectActiveMetadataId);
  const selectedTracks = useSelector(selectSelectedTracklets);

  const handleNewTrack = () => {
    if (!activeMetadataId) return;
    const newTrackletId = generateUUID();
    dispatch(imageViewerDataSlice.actions.startNewTrack(newTrackletId));
    dispatch(
      dataSlice.actions.addTracklet({
        metadataId: activeMetadataId,
        trackId: newTrackletId,
        color: getRandomHexColor(),
        linkedIds: [],
      }),
    );
  };
  const handleDeleteTrack = () => {
    dispatch(imageViewerDataSlice.actions.removeActiveTrack());
    activeTrackId && dispatch(dataSlice.actions.deleteTracklet(activeTrackId));
  };
  const handleConfirmTrack = () => {
    dispatch(imageViewerDataSlice.actions.toggleTimeLinking(false));
  };

  const handleEditTrack = () => {
    if (selectedTracks.length === 1) {
      dispatch(
        imageViewerDataSlice.actions.setTLinkingTrackId(selectedTracks[0]),
      );
    }
    dispatch(imageViewerDataSlice.actions.clearTrackSelection());
  };
  return (
    <Stack alignItems="flex-start" sx={{ width: "100%" }}>
      <ButtonContainer>
        <Box
          sx={{
            display: "flex",
            flexDirection: "row",
            justifyContent: "space-between",
            width: "100%",
            px: 2,
          }}
        >
          <OperationButton onClick={handleNewTrack} disabled={active}>
            New Track
          </OperationButton>
          <OperationButton
            onClick={handleEditTrack}
            disabled={selectedTracks.length !== 1}
          >
            Edit Track
          </OperationButton>
        </Box>
      </ButtonContainer>

      <Box
        sx={{
          display: "flex",
          flexDirection: "row",
          justifyContent: "space-between",
          width: "100%",
          px: 2,
        }}
      >
        <OperationButton onClick={handleConfirmTrack} disabled={!active}>
          Confirm
        </OperationButton>

        <OperationButton onClick={handleDeleteTrack} disabled={!active}>
          Delete
        </OperationButton>
      </Box>
    </Stack>
  );
};
