import { styled } from "@mui/material";

import { ClassifierArchitectureSettingsGrid } from "components/forms";
import { CollapsibleListItem } from "../CollapsibleListItem";

type ArchitectureSettingsProps = {
  onModelSelect: (modelIdx: number) => void;
};

export const ClassifierArchitectureSettingsListItem = ({
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
        <ClassifierArchitectureSettingsGrid onModelSelect={onModelSelect} />
      </StyledForm>
    </CollapsibleListItem>
  );
};
