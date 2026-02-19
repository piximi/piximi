import React from "react";
import { useSelector } from "react-redux";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { CssBaseline } from "@mui/material";
import { StyledEngineProvider, ThemeProvider } from "@mui/material/styles";

import { usePreferredMuiTheme } from "hooks";

import { AppErrorBoundary } from "components/errors/AppErrorBoundary";
import { AlertBar } from "components/ui";
import {
  DataPipelineProvider,
  FileUploadProvider,
  HelpProvider,
  SchedulerProvider,
} from "contexts";
import { ProjectViewer } from "views/ProjectViewer";
import { ImageViewer } from "views/ImageViewer";
import { MeasurementView } from "views/MeasurementView";
import { WelcomeScreen } from "./views/WelcomeScreen";
import HelpOverlay from "views/HelpOverlay";

import { selectAlertState } from "store/applicationSettings/selectors";
import { PipelineProgressIndicator } from "components/ui/PipelineProgressIndicator";

export const Application = () => {
  const theme = usePreferredMuiTheme();
  const alertState = useSelector(selectAlertState);

  return (
    <StyledEngineProvider injectFirst>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <AppErrorBoundary>
          <SchedulerProvider>
            <DataPipelineProvider>
              <FileUploadProvider>
                <HelpProvider>
                  <HelpOverlay />
                  <PipelineProgressIndicator />
                  {alertState.visible && <AlertBar alertState={alertState} />}
                  <BrowserRouter basename={"/"}>
                    <Routes>
                      <Route path="/" element={<WelcomeScreen />} />
                      <Route path="project" element={<ProjectViewer />} />
                      <Route path="imageviewer" element={<ImageViewer />} />
                      <Route
                        path="measurements"
                        element={<MeasurementView />}
                      />
                    </Routes>
                  </BrowserRouter>
                </HelpProvider>
              </FileUploadProvider>
            </DataPipelineProvider>
          </SchedulerProvider>
        </AppErrorBoundary>
      </ThemeProvider>
    </StyledEngineProvider>
  );
};
