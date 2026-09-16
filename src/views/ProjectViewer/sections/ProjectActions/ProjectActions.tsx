import { Box } from "@mui/material";

import { ConfirmReplaceDialogProvider } from "@ProjectViewer/hooks/useConfirmReplaceProjectDialog";

import { NewProjectButton } from "./NewProjectButton";
import { OpenProjectButton } from "./OpenProjectButton";
import { SaveProjectButton } from "./SaveProjectButton";

export const ProjectActions = () => {
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
        <NewProjectButton />
        <OpenProjectButton />
        <SaveProjectButton />
      </Box>
    </ConfirmReplaceDialogProvider>
  );
};
