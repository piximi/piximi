import { styled } from "@mui/material";

import { CollapsibleList } from "components/lists";
import { SegmenterArchitectureSettingsGrid } from "components/forms";

type ArchitectureSettingsProps = {
  onModelSelect: (modelIdx: number) => void;
};

export const SegmenterArchitectureSettingsListItem = ({
  onModelSelect,
}: ArchitectureSettingsProps) => {
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
        <SegmenterArchitectureSettingsGrid onModelSelect={onModelSelect} />
      </StyledForm>
    </CollapsibleList>
  );
};
