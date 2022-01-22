import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "@mui/material/styles";
import { StyledEngineProvider } from "@mui/material/styles";
import { MainView } from "../MainView";
import { AnnotatorView } from "../annotator";
import { usePreferredTheme } from "hooks/useTheme/usePreferredTheme";

export const Application = () => {
  const theme = usePreferredTheme();

  return (
    <StyledEngineProvider injectFirst>
      <ThemeProvider theme={theme}>
        <MainView />
        {/* <BrowserRouter>
          <Routes>
            <Route path="/" element={<MainView />} />
            <Route path="annotator" element={<AnnotatorView />} />
          </Routes>
        </BrowserRouter> */}
      </ThemeProvider>
    </StyledEngineProvider>
  );
};
