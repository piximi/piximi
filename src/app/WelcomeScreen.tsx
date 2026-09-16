import { useNavigate } from "react-router-dom";

import { Box, Button, Stack, styled } from "@mui/material";

import {
  useDialogHotkey,
  useMobileView,
  useProjectLoader,
  useWindowSize,
} from "hooks";

import { Logo } from "components/ui";
import { ExampleProjectDialog } from "components/dialogs";

import { HotkeyContext } from "utils/enums";

import { HelpItem } from "data/help/HelpContent";

const VisuallyHiddenInput = styled("input")({
  clip: "rect(0 0 0 0)",
  clipPath: "inset(50%)",
  height: 1,
  overflow: "hidden",
  position: "absolute",
  bottom: 0,
  left: 0,
  whiteSpace: "nowrap",
  width: 1,
});

export const WelcomeScreen = () => {
  const navigate = useNavigate();
  const {
    onClose: handleCloseCloseExampleProjectDialog,
    onOpen: handleOpenExampleProjectDialog,
    open: ExampleProjectOpen,
  } = useDialogHotkey(HotkeyContext.ExampleProjectDialog);

  const windowSize = useWindowSize();
  const mobileView = useMobileView();

  const { loadProject } = useProjectLoader();

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
  const handleOpenProject = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    event.persist();
    navigate("/project", { state: { init: true } });
    if (!event.currentTarget.files) return;
    const files = event.currentTarget.files;

    await loadProject(files);

    event.target.value = "";
  };

  return (
    <Box
      sx={{
        height: "100vh",
        width: "100%",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <Box
        sx={{
          maxWidth: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
        }}
      >
        <Logo width={windowSize.width * 0.8} height={100} />
        <Stack spacing={2} sx={{ mt: 4 }}>
          <Stack direction={mobileView ? "column" : "row"} spacing={2}>
            <Button
              data-help={HelpItem.StartNewProject}
              onClick={handleNewProject}
              variant="outlined"
              color="primary"
              sx={{ width: "210px" }}
              data-testid="start-new-project"
            >
              Start New Project
            </Button>
            <Button
              component="label"
              role={undefined}
              variant="outlined"
              tabIndex={-1}
              sx={{ width: "210px" }}
              data-testid="upload-project"
            >
              Upload Project
              <VisuallyHiddenInput
                type="file"
                accept=".zarr, application/zip"
                onChange={handleOpenProject}
                multiple
              />
            </Button>

            <Button
              data-help={HelpItem.OpenProject}
              onClick={handleOpenExampleProjectDialog}
              variant="outlined"
              color="primary"
              sx={{ width: "210px" }}
              data-testid="open-example-project"
            >
              Open Example Project
            </Button>
          </Stack>
          <Stack justifyContent={"center"} alignItems="center">
            <Button
              data-help={HelpItem.Documentation}
              component="a"
              href="https://documentation.piximi.app"
              target="_blank"
              rel="noopener noreferrer"
              variant="outlined"
              color="primary"
              sx={{ width: "210px" }}
              data-testid="documentation"
            >
              Documentation
            </Button>
          </Stack>
        </Stack>
      </Box>
      <ExampleProjectDialog
        open={ExampleProjectOpen}
        onClose={handleCloseDialog}
      />
    </Box>
  );
};
