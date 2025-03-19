import { useMemo } from "react";
import {
  Box,
  Button,
  Dialog,
  DialogContent,
  DialogTitle,
  List,
  ListItem,
  Palette,
  Stack,
  Typography,
} from "@mui/material";
import { HelpItem } from "components/layout/HelpDrawer/HelpContent";
import { CollapsibleList } from "components/ui";
import { Logo } from "components/ui";
import { useDialog, useDialogHotkey, usePreferredMuiTheme } from "hooks";
import { useNavigate } from "react-router-dom";
import { HotkeyContext } from "utils/enums";
import { logger } from "utils/logUtils";
import { ExampleProjectDialog } from "views/ProjectViewer/components/dialogs";

export const WelcomeScreen = () => {
  const navigate = useNavigate();
  const theme = usePreferredMuiTheme();
  const {
    onClose: handleCloseCloseExampleProjectDialog,
    onOpen: handleOpenExampleProjectDialog,
    open: ExampleProjectOpen,
  } = useDialogHotkey(HotkeyContext.ExampleProjectDialog);
  const { open, onClose, onOpen } = useDialog();

  const palette = useMemo(() => {
    const groups: Array<keyof Palette> = [
      "action",
      "background",
      "common",
      "divider",
      "error",
      "grey",
      "info",
      "primary",
      "secondary",
      "success",
      "text",
      "warning",
    ];
    return (
      <List>
        {groups.map((group) => {
          return typeof theme.palette[group] === "object" ? (
            <CollapsibleList primary={group} dense disablePadding>
              {Object.entries(theme.palette[group])
                .filter((entry) => typeof entry[1] === "string")
                .map((item, idx) => (
                  <ListItem key={idx}>
                    <Typography>{item[0]}</Typography>
                    <Box
                      marginLeft={2}
                      width="100px"
                      height="1rem"
                      sx={{
                        backgroundColor: item[1],
                        border: "1px solid white",
                        borderRadius: 1,
                      }}
                    ></Box>
                  </ListItem>
                ))}
            </CollapsibleList>
          ) : (
            <ListItem>
              <Typography>{group}</Typography>
              <Box
                marginLeft={2}
                width="100px"
                height="1rem"
                sx={{
                  backgroundColor: theme.palette[group] as string,
                  border: "1px solid white",
                  borderRadius: 1,
                }}
              ></Box>
            </ListItem>
          );
        })}
      </List>
    );
  }, [theme]);

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
          <Button
            data-help={HelpItem.StartNewProject}
            onClick={handleNewProject}
            variant="outlined"
            color="primary"
          >
            Start New Project
          </Button>
          <Button
            data-help={HelpItem.OpenExampleProject}
            onClick={handleOpenExampleProjectDialog}
            variant="outlined"
            color="primary"
          >
            Open Example Project
          </Button>
          <Button
            data-help={HelpItem.Documentation}
            component="a"
            href="https://documentation.piximi.app"
            target="_blank"
            rel="noopener noreferrer"
            variant="outlined"
            color="primary"
          >
            Documentation
          </Button>
          {import.meta.env.DEV && (
            <Button
              onClick={() => {
                logger(theme);
                onOpen();
              }}
              variant="outlined"
              color="primary"
            >
              Show Palette
            </Button>
          )}
        </Stack>
      </Box>
      <ExampleProjectDialog
        open={ExampleProjectOpen}
        onClose={handleCloseDialog}
      />
      {import.meta.env.Dev && (
        <Dialog open={open} onClose={onClose}>
          <DialogTitle>Palette</DialogTitle>
          <DialogContent>{palette}</DialogContent>
        </Dialog>
      )}
    </Box>
  );
};
