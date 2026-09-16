import { Box } from "@mui/material";

import { ConfirmReplaceDialogProvider } from "@ProjectViewer/hooks/useConfirmReplaceProjectDialog";

import { NewProjectButton } from "./NewProjectButton";
import { OpenProjectButton } from "./OpenProjectButton";
import { SaveProjectButton } from "./SaveProjectButton";

export const ProjectActions = () => {
  return (
    <ConfirmReplaceDialogProvider>
      <Box
        sx={{ display: "flex", justifyContent: "space-evenly", width: "100%" }}
      >
        <NewProjectButton />
        <OpenProjectButton />
        <SaveProjectButton />
      </Box>
    </ConfirmReplaceDialogProvider>
  );
};
