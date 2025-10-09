import { Box, Typography } from "@mui/material";
import { DIMENSIONS } from "utils/constants";
import { PartialDivider } from "components/ui/divider/PartialDivider";
import { TrackCreationControls } from "./TrackCreation";
import { TrackControls } from "./TrackLinking";
import { TrackItems } from "./TrackItems";

const SectionDivider = ({ text }: { text: string }) => {
  return (
    <PartialDivider
      containerStyle={{ width: "100%" }}
      typographyVariant="caption"
      headerText={text}
      textTransform="uppercase"
      indentPercentage={12}
    />
  );
};

export const AnnotationTrackingSection = () => {
  return (
    <Box
      sx={{
        height: `calc(100vh - ${DIMENSIONS.toolDrawerWidth}px)`,
        px: 1,
      }}
    >
      <Typography
        variant="body1"
        sx={{
          mx: "auto",
          py: 1,
        }}
      >
        Annotation Tracking
      </Typography>
      <Box sx={{ overflowY: "scroll" }}>
        <SectionDivider text="Track Creation" />

        <TrackCreationControls />
        <SectionDivider text="Track Linking" />

        <TrackControls />
        <SectionDivider text="Tracks" />

        <TrackItems />
      </Box>
    </Box>
  );
};
