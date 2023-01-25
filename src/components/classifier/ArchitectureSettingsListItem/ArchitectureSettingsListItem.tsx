import { styled } from "@mui/material";

import { ArchitectureSettingsGrid } from "./ArchitectureSettingsGrid/ArchitectureSettingsGrid";
import { CollapsibleList } from "components/common/CollapsibleList";

export const ArchitectureSettingsListItem = () => {
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
        <ArchitectureSettingsGrid />
      </StyledForm>
    </CollapsibleList>
  );
};
