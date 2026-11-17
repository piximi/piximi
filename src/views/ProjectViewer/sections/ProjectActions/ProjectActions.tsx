import { Box } from "@mui/material";

import { useCapability } from "core/backend";

import { ConfirmReplaceDialogProvider } from "@ProjectViewer/hooks/useConfirmReplaceProjectDialog";

import { NewProjectButton } from "./NewProjectButton";
import { OpenProjectButton } from "./OpenProjectButton";
import { SaveProjectButton } from "./SaveProjectButton";

export const ProjectActions = () => {
  // A backend that holds the project itself owns opening and saving it.
  const projectIO = useCapability("project.io");
  const upload = useCapability("ingest.upload");
  return (
    <ConfirmReplaceDialogProvider>
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          width: "100%",
          px: 2,
        }}
      >
        {projectIO && <NewProjectButton />}
        {(projectIO || upload) && <OpenProjectButton />}
        {projectIO && <SaveProjectButton />}
      </Box>
    </ConfirmReplaceDialogProvider>
  );
};
