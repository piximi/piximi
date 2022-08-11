import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";

import { StyledEngineProvider, ThemeProvider } from "@mui/material/styles";

import { usePreferredMuiTheme } from "hooks";

import { MainView } from "../main";
import { AnnotatorView } from "../annotator";

export const Application = () => {
  const theme = usePreferredMuiTheme();

  return (
    <StyledEngineProvider injectFirst>
      <ThemeProvider theme={theme}>
        <BrowserRouter basename={"/"}>
          <Routes>
            <Route path="/" element={<MainView />} />
            <Route path="annotator" element={<AnnotatorView />} />
          </Routes>
        </BrowserRouter>
      </ThemeProvider>
    </StyledEngineProvider>
  );
};
