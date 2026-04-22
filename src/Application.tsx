import React, { useEffect } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { CssBaseline } from "@mui/material";
import { StyledEngineProvider, ThemeProvider } from "@mui/material/styles";

import { usePreferredMuiTheme } from "hooks";

import { ProjectViewer } from "views/ProjectViewer";
import { ProjectViewer as ProjectViewerV2 } from "views/ProjectViewerV2";
import { ImageViewer } from "views/ImageViewer";
import { MeasurementView } from "views/MeasurementView";
import { WelcomeScreen } from "./views/WelcomeScreen";

import { FileUploadProvider, HelpProvider } from "contexts";
import HelpOverlay from "views/HelpOverlay";
import { useSelector } from "react-redux";
import { selectAlertState } from "store/applicationSettings/selectors";
import { AlertBar } from "components/ui";
import { SchedulerProvider } from "contexts/worker-scheduler";
import { DataConnector } from "utils/data-connector";

export const Application = () => {
  const theme = usePreferredMuiTheme();
  const alertState = useSelector(selectAlertState);

  useEffect(() => {
    return () => {
      if (import.meta.env.DEV) {
        const dataConnector = DataConnector.getInstance();
        dataConnector.clearAll();
      }
    };
  });

  return (
    <StyledEngineProvider injectFirst>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <SchedulerProvider>
          <FileUploadProvider>
            <HelpProvider>
              <HelpOverlay />
              {alertState.visible && <AlertBar alertState={alertState} />}
              <BrowserRouter basename={"/"}>
                <Routes>
                  <Route path="/" element={<WelcomeScreen />} />
                  <Route
                    path="project"
                    element={
                      import.meta.env.VITE_USE_V2 === "true" ? (
                        <ProjectViewerV2 />
                      ) : (
                        <ProjectViewer />
                      )
                    }
                  />
                  <Route path="imageviewer" element={<ImageViewer />} />
                  <Route path="measurements" element={<MeasurementView />} />
                </Routes>
              </BrowserRouter>
            </HelpProvider>
          </FileUploadProvider>
        </SchedulerProvider>
      </ThemeProvider>
    </StyledEngineProvider>
  );
};
