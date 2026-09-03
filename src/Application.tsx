import { useEffect } from "react";

import { BrowserRouter, Routes, Route } from "react-router-dom";
import { useSelector } from "react-redux";

import { CssBaseline } from "@mui/material";
import { StyledEngineProvider, ThemeProvider } from "@mui/material/styles";

import { usePreferredMuiTheme } from "hooks";

import { AlertBar, TaskProgressToasts } from "components/ui";

import { ProjectViewer } from "views/ProjectViewer";
import { ImageViewer } from "views/ImageViewer";
import { MeasurementView } from "views/MeasurementViewer";
import { HelpProvider } from "contexts";
import HelpOverlay from "views/HelpOverlay";
import { selectAlertState } from "store/applicationSettings/selectors";
import { DataConnector } from "core/data-connector";

import { WelcomeScreen } from "./views/WelcomeScreen";

export const Application = () => {
  const theme = usePreferredMuiTheme();
  const alertState = useSelector(selectAlertState);

  useEffect(() => {
    if (import.meta.env.DEV) {
      const nav = performance.getEntriesByType(
        "navigation",
      )[0] as PerformanceNavigationTiming;
      if (nav?.type === "reload") {
        DataConnector.getInstance().clearAll();
      }
    }
  }, []); // empty deps → runs once on mount

  return (
    <StyledEngineProvider injectFirst>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <HelpProvider>
          <HelpOverlay />
          {alertState.visible && <AlertBar alertState={alertState} />}
          <TaskProgressToasts />
          <BrowserRouter basename={"/"}>
            <Routes>
              <Route path="/" element={<WelcomeScreen />} />
              <Route path="project" element={<ProjectViewer />} />
              <Route path="imageviewer" element={<ImageViewer />} />
              <Route path="measurements" element={<MeasurementView />} />
            </Routes>
          </BrowserRouter>
        </HelpProvider>
      </ThemeProvider>
    </StyledEngineProvider>
  );
};
