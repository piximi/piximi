import { Box, Button, Stack } from "@mui/material";
import { Logo } from "components/ui/logo";
import { useDialogHotkey } from "hooks";
import { useNavigate } from "react-router-dom";
import { HotkeyContext } from "utils/enums";
import { ExampleProjectDialog } from "views/ProjectViewer/components/dialogs";

export const WelcomeScreen = () => {
  const navigate = useNavigate();
  const {
    onClose: handleCloseCloseExampleProjectDialog,
    onOpen: handleOpenExampleProjectDialog,
    open: ExampleProjectOpen,
  } = useDialogHotkey(HotkeyContext.ExampleProjectDialog);

  const handleCloseDialog = (
    event?: object,
    reason?: "backdropClick" | "escapeKeyDown",
  ) => {
    handleCloseCloseExampleProjectDialog();
    if (!reason) {
      navigate("/project", { state: { init: true } });
    }
  };
  const handleNewProject = () => {
    navigate("/project", { state: { init: true } });
  };
  return (
    <Box
      sx={{
        height: "100vh",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
        }}
      >
        <Logo width={500} height={100} />
        <Stack spacing={2} sx={{ mt: 4 }}>
          <Button onClick={handleNewProject} variant="outlined" color="primary">
            Start New Project
          </Button>
          <Button
            onClick={handleOpenExampleProjectDialog}
            variant="outlined"
            color="primary"
          >
            Open Example Project
          </Button>
          <Button
            component="a"
            href="https://documentation.piximi.app"
            target="_blank"
            rel="noopener noreferrer"
            variant="outlined"
            color="primary"
          >
            Documentation
          </Button>
        </Stack>
      </Box>
      <ExampleProjectDialog
        open={ExampleProjectOpen}
        onClose={handleCloseDialog}
      />
    </Box>
  );
};
