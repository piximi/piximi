import { Box, Stack } from "@mui/material";
import { batch, useDispatch, useSelector } from "react-redux";
import { dataSlice } from "store/data";
import {
  selectAnnotationEntitiesByTracklet,
  selectTrackletEntities,
} from "store/data/selectors";
import { isPopulatedTracklet } from "store/data/utils";
import { ButtonContainer } from "views/ImageViewer/components/ButtonContainer";
import { OperationButton } from "views/ImageViewer/components/OperationButton";
import { selectActiveMetadataId } from "views/ImageViewer/state/image-viewer-data/selectors";
import {
  selectEditSession,
  selectSelectedTrackletIds,
} from "views/ImageViewer/state/tracklet-editing/selectors";
import { trackEditingSlice } from "views/ImageViewer/state/tracklet-editing/trackletEditingSlice";

export const ManualTrackCreation = () => {
  const dispatch = useDispatch();
  const activeMetadataId = useSelector(selectActiveMetadataId);
  const selectedTracks = useSelector(selectSelectedTrackletIds);
  const tracklets = useSelector(selectTrackletEntities);
  const getAnnsByTracklet = useSelector(selectAnnotationEntitiesByTracklet);
  const editSession = useSelector(selectEditSession);

  const handleNewTrack = () => {
    if (!activeMetadataId) return;
    dispatch(trackEditingSlice.actions.beginCreateTracklet(activeMetadataId));
  };
  const handleCancelEdits = () => {
    dispatch(trackEditingSlice.actions.exitEditSession());
  };
  const handleDeleteTrack = () => {
    if (editSession.mode !== null) return;
    dispatch(dataSlice.actions.batchDeleteTracklet(selectedTracks));
  };
  const handleConfirmTrack = () => {
    if (editSession.mode === null) return;
    const pendingTracklet = editSession.pendingTracklet;
    if (pendingTracklet && isPopulatedTracklet(pendingTracklet))
      batch(() => {
        dispatch(dataSlice.actions.addTracklet(pendingTracklet));
        dispatch(trackEditingSlice.actions.exitEditSession());
      });
  };

  const handleEditTrack = () => {
    if (selectedTracks.length === 1) {
      const selectedTracklet = tracklets[selectedTracks[0]];
      const frames = Object.fromEntries(
        getAnnsByTracklet(selectedTracklet.id).map((ann) => [
          ann.timepoint,
          ann.id,
        ]),
      );
      dispatch(
        trackEditingSlice.actions.beginEditTracklet({
          tracklet: selectedTracklet,
          frames,
        }),
      );
    }
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
          <OperationButton
            onClick={handleNewTrack}
            disabled={editSession.mode !== null}
          >
            New Track
          </OperationButton>
          <OperationButton
            onClick={handleEditTrack}
            disabled={selectedTracks.length !== 1}
          >
            Edit Track
          </OperationButton>
        </Box>

        <Box
          sx={{
            display: "flex",
            flexDirection: "row",
            justifyContent: "space-between",
            width: "100%",
            px: 2,
          }}
        >
          <OperationButton
            onClick={handleConfirmTrack}
            disabled={editSession.mode === null}
          >
            Confirm
          </OperationButton>
          <OperationButton
            onClick={handleCancelEdits}
            disabled={editSession.mode === null}
          >
            Cancel
          </OperationButton>
        </Box>
        <Box
          sx={{
            display: "flex",
            flexDirection: "row",
            justifyContent: "space-between",
            width: "100%",
            px: 2,
          }}
        >
          <OperationButton
            onClick={handleDeleteTrack}
            disabled={selectedTracks.length === 0}
          >
            Delete
          </OperationButton>
        </Box>
      </ButtonContainer>
    </Stack>
  );
};
