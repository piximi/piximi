import { Box, Typography } from "@mui/material";
import { SectionDivider } from "components/ui/divider/SectionDivider";
import { TrackCreationControls } from "./TrackCreation";
import { TrackManagement } from "./TrackManagement";
import { TrackList } from "./TrackList";
import { DIMENSIONS } from "utils/constants";

export const TrackingControlsContainer = () => {
  return (
    <Box
      sx={{
        height: `calc(100vh - ${DIMENSIONS.toolDrawerWidth}px)`,
        px: 1,
        display: "flex",
        flexDirection: "column",
      }}
    >
      <Typography
        variant="h6"
        sx={{
          mx: "auto",
          py: 1,
        }}
      >
        Annotation Tracking
      </Typography>
      <Box
        sx={{
          overflowY: "scroll",
          flexGrow: 1,
          minHeight: 0,
          display: "flex",
          flexDirection: "column",
        }}
      >
        <SectionDivider text="Tracklet Creation" />

        <TrackCreationControls />
        <SectionDivider text="Track Management" />

        <TrackManagement />
        <SectionDivider text="Tracklets" />

        <TrackList />
      </Box>
    </Box>
  );
};
