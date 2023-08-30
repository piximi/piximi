import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";

import { StyledEngineProvider, ThemeProvider } from "@mui/material/styles";

import { usePreferredMuiTheme } from "hooks";

import { ImageViewer } from "../ImageViewer";
import { MainView } from "views/_MainView";

export const Application = () => {
  const theme = usePreferredMuiTheme();

  return (
    <StyledEngineProvider injectFirst>
      <ThemeProvider theme={theme}>
        <BrowserRouter basename={"/"}>
          <Routes>
            <Route path="/" element={<MainView />} />
            <Route path="annotator" element={<ImageViewer />} />
          </Routes>
        </BrowserRouter>
      </ThemeProvider>
    </StyledEngineProvider>
  );
};
