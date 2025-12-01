import { Stack } from "@mui/material";
import { OperationButtonRow } from "features/components/OperationButtonRow";
import { batch, useDispatch, useSelector } from "react-redux";
import { dataSlice } from "store/data";
import {
  selectAnnotationEntitiesByTracklet,
  selectMetadataToTracklets,
  selectTrackletEntities,
} from "store/data/selectors";
import { isPopulatedTracklet } from "store/data/utils";
import { ButtonContainer } from "features/components/ButtonContainer";
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
  const metadata2Tracklets = useSelector(selectMetadataToTracklets);

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
  const handleDeleteAllTracks = () => {
    if (!activeMetadataId) return;
    dispatch(
      dataSlice.actions.batchDeleteTracklet(
        metadata2Tracklets[activeMetadataId],
      ),
    );
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
        <OperationButtonRow>
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
        </OperationButtonRow>

        <OperationButtonRow>
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
        </OperationButtonRow>
        <OperationButtonRow>
          <OperationButton
            onClick={handleDeleteTrack}
            disabled={selectedTracks.length === 0}
          >
            Delete
          </OperationButton>
          <OperationButton
            variant="text"
            disabled={
              !activeMetadataId ||
              !metadata2Tracklets[activeMetadataId] ||
              metadata2Tracklets[activeMetadataId].length === 0
            }
            onClick={handleDeleteAllTracks}
            size="small"
          >
            Delete All
          </OperationButton>
        </OperationButtonRow>
      </ButtonContainer>
    </Stack>
  );
};
