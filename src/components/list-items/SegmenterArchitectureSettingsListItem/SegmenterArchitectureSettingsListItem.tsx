import { styled } from "@mui/material";

import { SegmenterArchitectureSettingsGrid } from "components/forms";
import { CollapsibleListItem } from "../CollapsibleListItem";

//TODO: revisit forms

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
    <CollapsibleListItem
      primaryText="Architecture Settings"
      carotPosition="start"
      divider={true}
    >
      <StyledForm noValidate autoComplete="off">
        <SegmenterArchitectureSettingsGrid onModelSelect={onModelSelect} />
      </StyledForm>
    </CollapsibleListItem>
  );
};
