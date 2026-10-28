import { useRef, useState } from "react";

import { useNavigate } from "react-router-dom";

import {
  Box,
  Button,
  ListItemText,
  Menu,
  MenuItem,
  Stack,
} from "@mui/material";

import {
  useDialogHotkey,
  useMobileView,
  useProjectLoader,
  useWindowSize,
} from "hooks";

import { Logo } from "components/ui";
import { ExampleProjectDialog } from "components/dialogs";

import { HelpItem } from "help/HelpContent";

import { HotkeyContext } from "utils/enums";

export const WelcomeScreen = () => {
  const navigate = useNavigate();
  const [uploadMenuAnchor, setUploadMenuAnchor] = useState<HTMLElement | null>(
    null,
  );
  const fileInputRef = useRef<HTMLInputElement>(null);
  const folderInputRef = useRef<HTMLInputElement>(null);
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
  const handleOpenFilePicker = (ref: React.RefObject<HTMLInputElement>) => {
    setUploadMenuAnchor(null);
    ref.current?.click();
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
              variant="outlined"
              sx={{ width: "210px" }}
              data-testid="upload-project"
              onClick={(event) => setUploadMenuAnchor(event.currentTarget)}
            >
              Upload Project
            </Button>
            <Menu
              anchorEl={uploadMenuAnchor}
              open={Boolean(uploadMenuAnchor)}
              onClose={() => setUploadMenuAnchor(null)}
              anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
              transformOrigin={{ vertical: "top", horizontal: "center" }}
              slotProps={{ paper: { sx: { width: "210px" } } }}
            >
              <MenuItem
                dense
                onClick={() => handleOpenFilePicker(folderInputRef)}
              >
                <ListItemText>
                  From <code>.zarr</code>
                </ListItemText>
              </MenuItem>
              <MenuItem
                dense
                onClick={() => handleOpenFilePicker(fileInputRef)}
              >
                <ListItemText>
                  From <code>.zip</code> or <code>.piximi</code>
                </ListItemText>
              </MenuItem>
            </Menu>

            <input
              ref={fileInputRef}
              type="file"
              hidden
              accept=".piximi, application/zip"
              onChange={handleOpenProject}
              data-testid="upload-project-file"
            />
            <input
              ref={folderInputRef}
              type="file"
              hidden
              onChange={handleOpenProject}
              data-testid="upload-project-folder"
              // @ts-expect-error -- `webkitdirectory` makes the picker select a folder
              // (a `.zarr` project is a directory, not a single file). Browsers support it,
              // but @types/react@17 doesn't declare it on InputHTMLAttributes.
              webkitdirectory=""
            />

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
