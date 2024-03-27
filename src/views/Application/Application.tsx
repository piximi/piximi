import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";

import { StyledEngineProvider, ThemeProvider } from "@mui/material/styles";

import { usePreferredMuiTheme } from "hooks";

import { ProjectViewerNew } from "views/ProjectViewer";
import { ImageViewerNew } from "views/ImageViewer";

export const Application = () => {
  const theme = usePreferredMuiTheme();

  return (
    <StyledEngineProvider injectFirst>
      <ThemeProvider theme={theme}>
        <BrowserRouter basename={"/piximi-beta"}>
          <Routes>
            <Route path="/" element={<ProjectViewerNew />} />
            <Route path="imageviewer" element={<ImageViewerNew />} />
          </Routes>
        </BrowserRouter>
      </ThemeProvider>
    </StyledEngineProvider>
  );
};
