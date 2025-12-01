import { useDispatch, useSelector } from "react-redux";
import { Stack, ToggleButton, ToggleButtonGroup } from "@mui/material";

import { OperationButton } from "views/ImageViewer/components/OperationButton";
import { trackEditingSlice } from "views/ImageViewer/state/tracklet-editing/trackletEditingSlice";
import {
  selectManagementActive,
  selectManagementMode,
} from "views/ImageViewer/state/tracklet-editing/selectors";
import { TrackletManagementMode } from "views/ImageViewer/state/tracklet-editing/types";

export const TrackManagement = () => {
  const dispatch = useDispatch();
  const managementActive = useSelector(selectManagementActive);
  const managementMode = useSelector(selectManagementMode);
  const handleStartManaging = () =>
    dispatch(trackEditingSlice.actions.beginTrackManagement());
  const handleStopManaging = () => {
    dispatch(trackEditingSlice.actions.endTrackManagement());
  };

  const handleManagementModeSelect = (
    _event: React.MouseEvent<HTMLElement>,
    nextView: TrackletManagementMode,
  ) => {
    dispatch(trackEditingSlice.actions.setTrackletManagementMode(nextView));
    if (nextView === "sever" || nextView === "join" || nextView === null) {
      dispatch(
        trackEditingSlice.actions.setPrimaryManagementTracklet(undefined),
      );
      dispatch(trackEditingSlice.actions.clearTrackletSelection());
    }
  };
  return (
    <Stack
      sx={{
        width: "100%",
        mx: "auto",
        alignItems: "center",
        gap: 1.5,
        pb: 2,
      }}
    >
      <Stack
        direction="row"
        sx={{ width: "100%", justifyContent: "space-around" }}
      >
        <OperationButton
          variant="text"
          onClick={handleStartManaging}
          disabled={managementActive}
        >
          Begin
        </OperationButton>
        <OperationButton
          variant="text"
          onClick={handleStopManaging}
          disabled={!managementActive}
        >
          End
        </OperationButton>
      </Stack>
      <ToggleButtonGroup
        orientation="vertical"
        color="primary"
        value={managementMode}
        exclusive
        onChange={handleManagementModeSelect}
        disabled={!managementActive}
        size="small"
        fullWidth
      >
        <ToggleButton value="create">Create Relationship</ToggleButton>
        <ToggleButton value="remove">Remove Relationship</ToggleButton>
        <ToggleButton value="join">Join Tracks</ToggleButton>
        <ToggleButton value="sever">Sever Tracks</ToggleButton>
      </ToggleButtonGroup>
    </Stack>
  );
};
