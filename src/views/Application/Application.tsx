import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";

import { StyledEngineProvider, ThemeProvider } from "@mui/material/styles";

import { usePreferredMuiTheme } from "hooks";

import { ProjectViewer } from "views/ProjectViewer";
import { ImageViewer } from "views/ImageViewer";

export const Application = () => {
  const theme = usePreferredMuiTheme();

  return (
    <StyledEngineProvider injectFirst>
      <ThemeProvider theme={theme}>
        <BrowserRouter basename={"/piximi-beta"}>
          <Routes>
            <Route path="/" element={<ProjectViewer />} />
            <Route path="imageviewer" element={<ImageViewer />} />
          </Routes>
        </BrowserRouter>
      </ThemeProvider>
    </StyledEngineProvider>
  );
};
