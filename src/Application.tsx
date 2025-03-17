import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { CssBaseline } from "@mui/material";
import { StyledEngineProvider, ThemeProvider } from "@mui/material/styles";

import { usePreferredMuiTheme } from "hooks";

import { ProjectViewer } from "views/ProjectViewer";
import { ImageViewer } from "views/ImageViewer";
import { MeasurementView } from "views/MeasurementView";
import { WelcomeScreen } from "./views/WelcomeScreen";

import { FileUploadProvider, HelpProvider } from "contexts";
import HelpOverlay from "views/HelpOverlay";

export const Application = () => {
  const theme = usePreferredMuiTheme();

  return (
    <StyledEngineProvider injectFirst>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <FileUploadProvider>
          <HelpProvider>
            <HelpOverlay />
            <BrowserRouter basename={"/"}>
              <Routes>
                <Route path="/" element={<WelcomeScreen />} />
                <Route path="project" element={<ProjectViewer />} />
                <Route path="imageviewer" element={<ImageViewer />} />
                <Route path="measurements" element={<MeasurementView />} />
              </Routes>
            </BrowserRouter>
          </HelpProvider>
        </FileUploadProvider>
      </ThemeProvider>
    </StyledEngineProvider>
  );
};
