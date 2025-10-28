import { Stack, useTheme } from "@mui/material";

import { PartialDivider } from "components/ui/divider/PartialDivider";

import { ManualTrackCreation } from "./ManualTrackCreation";
import { AutoTrackCreation } from "./AutoTrackCreation";

export const TrackCreationControls = () => {
  const theme = useTheme();

  return (
    <Stack alignItems="flex-start">
      <PartialDivider
        containerStyle={{
          width: "100%",
        }}
        typographyVariant="body2"
        headerText="Manual"
        textTransform="uppercase"
        indentPercentage={5}
        color={theme.palette.grey[500]}
      />
      <ManualTrackCreation />
      <PartialDivider
        containerStyle={{
          width: "100%",
        }}
        typographyVariant="body2"
        headerText="Automatic"
        textTransform="uppercase"
        indentPercentage={5}
        color={theme.palette.grey[500]}
      />
      <AutoTrackCreation />
    </Stack>
  );
};
