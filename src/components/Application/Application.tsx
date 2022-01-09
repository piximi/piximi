import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Provider } from "react-redux";
import { DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import { ThemeProvider } from "@mui/material/styles";
import { StyledEngineProvider } from "@mui/material/styles";
import { createTheme } from "@mui/material/styles";
import { productionStore } from "../../store/stores";
import { MainView } from "../MainView";
import { AnnotatorView } from "../annotator";

export const Application = () => {
  const theme = createTheme();

  return (
    <Provider store={productionStore}>
      <StyledEngineProvider injectFirst>
        <ThemeProvider theme={theme}>
          <DndProvider backend={HTML5Backend}>
            <BrowserRouter>
              <Routes>
                <Route path="/" element={<MainView />} />
                <Route path="annotator" element={<AnnotatorView />} />
              </Routes>
            </BrowserRouter>
          </DndProvider>
        </ThemeProvider>
      </StyledEngineProvider>
    </Provider>
  );
};
