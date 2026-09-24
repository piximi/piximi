import { Box } from "@mui/material";

import { useMobileView } from "hooks";

import { DividerHeader } from "components/ui";
import { BaseAppDrawer } from "components/app-drawer";

import { ModelTaskSection } from "../ModelTaskSection";
import { ProjectActions } from "../ProjectActions";
import { ProjectViewerCategories } from "../ProjectViewerCategories";

export const ProjectDrawer = () => {
  const isMobile = useMobileView();
  return isMobile ? (
    <></>
  ) : (
    <Box
      sx={{
        display: "flex",
        flexGrow: 1,
        minHeight: 0,
        gridArea: "action-drawer",
      }}
    >
      <BaseAppDrawer>
        <DividerHeader
          sx={{ mt: 1 }}
          textAlign="left"
          typographyVariant="caption"
          textTransform="uppercase"
        >
          File I/O
        </DividerHeader>
        <ProjectActions />
        <DividerHeader
          sx={{ my: 1 }}
          textAlign="left"
          typographyVariant="caption"
          textTransform="uppercase"
        >
          Learning Task
        </DividerHeader>
        <ModelTaskSection />

        <ProjectViewerCategories />
      </BaseAppDrawer>
    </Box>
  );
};
