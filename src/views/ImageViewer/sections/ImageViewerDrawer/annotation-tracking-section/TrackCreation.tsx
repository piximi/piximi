import { Box, Button, Stack } from "@mui/material";
import { useDispatch, useSelector } from "react-redux";
import { dataSlice } from "store/data";
import { generateUUID } from "store/data/utils";
import { ButtonContainer } from "views/ImageViewer/components/ButtonContainer";
import { OperationButton } from "views/ImageViewer/components/OperationButton";
import { imageViewerDataSlice } from "views/ImageViewer/state/image-viewer-data/ImageViewerDataSlice";
import {
  selectActiveTrackId,
  selectTimeLinkingState,
} from "views/ImageViewer/state/image-viewer-data/selectors";
import { useSelectedTracklets } from "views/ImageViewer/state/TrackletContext";

function getRandomColor() {
  const letters = "0123456789ABCDEF";
  let color = "#";
  for (let i = 0; i < 6; i++) {
    color += letters[Math.floor(Math.random() * 16)];
  }
  return color;
}

export const TrackCreationControls = () => {
  const dispatch = useDispatch();
  const activeTrackId = useSelector(selectActiveTrackId);
  const active = useSelector(selectTimeLinkingState);
  const { primaryTrack, setPrimaryTrack, setSecondaryTracks } =
    useSelectedTracklets();

  const handleNewTrack = () => {
    const newTrackletId = generateUUID();
    dispatch(imageViewerDataSlice.actions.startNewTrack(newTrackletId));
    dispatch(
      dataSlice.actions.addTracklet({
        trackId: newTrackletId,
        color: getRandomColor(),
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
    if (primaryTrack) {
      dispatch(imageViewerDataSlice.actions.setTLinkingTrackId(primaryTrack));
    }
    setPrimaryTrack(undefined);
    setSecondaryTracks([]);
  };
  return (
    <Stack alignItems="flex-start">
      <ButtonContainer>
        <Box
          sx={{
            display: "flex",
            flexDirection: "row",
            justifyContent: "space-between",
            width: "100%",
          }}
        >
          <OperationButton onClick={handleNewTrack} disabled={active}>
            New Track
          </OperationButton>
          <OperationButton onClick={handleEditTrack} disabled={!primaryTrack}>
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
        }}
      >
        <OperationButton onClick={handleConfirmTrack} disabled={!active}>
          Confirm
        </OperationButton>

        <OperationButton onClick={handleDeleteTrack} disabled={!active}>
          Delete
        </OperationButton>
      </Box>
      <Button variant="text" disabled={true} size="small">
        Auto Generate Tracklets
      </Button>
    </Stack>
  );
};
