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
  styled,
  Typography,
} from "@mui/material";
import { HelpItem } from "components/layout/HelpDrawer/HelpContent";
import { CollapsibleList } from "components/ui";
import { Logo } from "components/ui";
import {
  useDialog,
  useDialogHotkey,
  useMobileView,
  usePreferredMuiTheme,
  useWindowSize,
} from "hooks";
import { useNavigate } from "react-router-dom";
import { AlertType, HotkeyContext } from "utils/enums";
import { ExampleProjectDialog } from "views/ProjectViewer/components/dialogs";
import { batch, useDispatch } from "react-redux";
import { applicationSettingsSlice } from "store/applicationSettings";
import { fListToStore } from "utils/file-io/zarr/stores";
import { deserializeProject } from "utils/file-io/deserialize";
import { projectSlice } from "store/project";
import { dataSlice } from "store/data";
import classifierHandler from "utils/models/classification/classifierHandler";
import { classifierSlice } from "store/classifier";
import { segmenterSlice } from "store/segmenter";
import { AlertState } from "utils/types";

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
  const dispatch = useDispatch();
  const theme = usePreferredMuiTheme();
  const {
    onClose: handleCloseCloseExampleProjectDialog,
    onOpen: handleOpenExampleProjectDialog,
    open: ExampleProjectOpen,
  } = useDialogHotkey(HotkeyContext.ExampleProjectDialog);
  const { open, onClose, onOpen } = useDialog();

  const windowSize = useWindowSize();
  const mobileView = useMobileView();

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
            <CollapsibleList key={group} primary={group} dense disablePadding>
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
            <ListItem key={group}>
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
  const handleOpenProject = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    event.persist();
    navigate("/project", { state: { init: true } });
    if (!event.currentTarget.files) return;
    const files = event.currentTarget.files;

    // set indefinite loading
    dispatch(
      applicationSettingsSlice.actions.setLoadPercent({
        loadPercent: -1,
        loadMessage: "deserializing project...",
      }),
    );

    const { fileStore: zarrStore, loadedClassifiers } = await fListToStore(
      files,
      files.length === 1 && files[0].type === "application/zip",
    );
    const onLoadProgress = (loadPercent: number, loadMessage: string) => {
      dispatch(
        applicationSettingsSlice.actions.sendLoadPercent({
          loadPercent,
          loadMessage,
        }),
      );
    };
    deserializeProject(zarrStore, onLoadProgress)
      .then((res) => {
        if (!res) return;
        batch(() => {
          // indefinite load until dispatches complete
          dispatch(
            applicationSettingsSlice.actions.setLoadPercent({
              loadPercent: -1,
            }),
          );
          dispatch(projectSlice.actions.resetProject());
          dispatch(dataSlice.actions.initializeState({ data: res.data }));
          // loadPerecnt set to 1 here
          dispatch(
            projectSlice.actions.setProject({
              project: res.project,
            }),
          );
          classifierHandler.addModels(loadedClassifiers);
          dispatch(
            classifierSlice.actions.setClassifier({
              classifier: res.classifier,
            }),
          );

          dispatch(
            segmenterSlice.actions.setSegmenter({
              segmenter: res.segmenter,
            }),
          );
          dispatch(
            applicationSettingsSlice.actions.setLoadPercent({ loadPercent: 1 }),
          );
        });
      })
      .catch((err: Error) => {
        import.meta.env.NODE_ENV !== "production" &&
          import.meta.env.VITE_APP_LOG_LEVEL === "1" &&
          console.error(err);

        const warning: AlertState = {
          alertType: AlertType.Warning,
          name: "Could not parse project file",
          description: `Error while parsing the project file: ${err.name}\n${err.message}`,
        };

        dispatch(
          applicationSettingsSlice.actions.updateAlertState({
            alertState: warning,
          }),
        );
      });

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
          {import.meta.env.DEV && (
            <Button
              onClick={() => {
                onOpen();
              }}
              variant="outlined"
              color="primary"
            >
              {windowSize.width}
            </Button>
          )}
        </Stack>
      </Box>
      <ExampleProjectDialog
        open={ExampleProjectOpen}
        onClose={handleCloseDialog}
      />
      {import.meta.env.DEV && (
        <Dialog open={open} onClose={onClose}>
          <DialogTitle>Palette</DialogTitle>
          <DialogContent>{palette}</DialogContent>
        </Dialog>
      )}
    </Box>
  );
};
