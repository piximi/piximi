import { styled } from "@mui/material";

import { SegmenterArchitectureSettingsGrid } from "./ArchitectureSettingsGrid/SegmenterArchitectureSettingsGrid";
import { CollapsibleList } from "components/common/CollapsibleList";

export const SegmenterArchitectureSettingsListItem = () => {
  const StyledForm = styled("form")({
    // width: '100%',
    display: "flex",
    flexWrap: "wrap",
  });

  return (
    <CollapsibleList
      dense={false}
      primary="Architecture Settings"
      disablePadding={false}
      paddingLeft={true}
    >
      <StyledForm noValidate autoComplete="off">
        <SegmenterArchitectureSettingsGrid />
      </StyledForm>
    </CollapsibleList>
  );
};
