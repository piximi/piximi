import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "@mui/material/styles";
import { StyledEngineProvider } from "@mui/material/styles";
import { MainView } from "../MainView";
import { AnnotatorView } from "../annotator";
import { usePreferredMuiTheme } from "hooks/useTheme/usePreferredMuiTheme";

export const Application = () => {
  const theme = usePreferredMuiTheme();

  return (
    <StyledEngineProvider injectFirst>
      <ThemeProvider theme={theme}>
        <BrowserRouter
          basename={process.env.NODE_ENV === "production" ? "/prototype" : "/"}
        >
          <Routes>
            <Route path="/" element={<MainView />} />
            <Route path="annotator" element={<AnnotatorView />} />
          </Routes>
        </BrowserRouter>
      </ThemeProvider>
    </StyledEngineProvider>
  );
};
