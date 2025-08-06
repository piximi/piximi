import React from "react";
import { useEffect, useRef } from "react";
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
import { useSelector } from "react-redux";
import { selectAlertState } from "store/applicationSettings/selectors";
import { AlertBar } from "components/ui";

import * as Comlink from "comlink";

let globalWorker: any = null;

export const Application = () => {
  const theme = usePreferredMuiTheme();
  const alertState = useSelector(selectAlertState);

  useEffect(() => {
    globalWorker = new SharedWorker(
      new URL("./utils/web-workers/worker.js", import.meta.url)
    );

    const obj = Comlink.wrap(globalWorker.port) as any;
    //  console.log("The port is " + globalWorker.port);

    (async () => {
      try {
        const current = await obj.counter;
        alert(`Counter on load: ${current}`);
        await (obj as any).inc();
        const updated = await obj.counter;
        alert(`Counter after increment: ${updated}`);
      } catch (error) {
        // console.error("Error communicating with worker:", error);
      }
    })();
  }, []);

  return (
    <StyledEngineProvider injectFirst>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <FileUploadProvider>
          <HelpProvider>
            <HelpOverlay />
            {alertState.visible && <AlertBar alertState={alertState} />}
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
