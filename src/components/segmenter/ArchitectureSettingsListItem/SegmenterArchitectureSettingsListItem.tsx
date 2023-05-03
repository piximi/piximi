import { styled } from "@mui/material";

import { CollapsibleList } from "components/common/styled-components/CollapsibleList";
import { SegmenterArchitectureSettingsGrid } from "./ArchitectureSettingsGrid/SegmenterArchitectureSettingsGrid";

export const SegmenterArchitectureSettingsListItem = ({
  setIsModelPretrained,
  isModelPretrained,
}: {
  setIsModelPretrained: React.Dispatch<React.SetStateAction<boolean>>;
  isModelPretrained: boolean;
}) => {
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
        <SegmenterArchitectureSettingsGrid
          setIsModelPretrained={setIsModelPretrained}
          isModelPretrained={isModelPretrained}
        />
      </StyledForm>
    </CollapsibleList>
  );
};
