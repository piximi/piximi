import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { CssBaseline } from "@mui/material";
import { StyledEngineProvider, ThemeProvider } from "@mui/material/styles";

import { usePreferredMuiTheme } from "hooks";

import { ProjectViewer } from "views/ProjectViewer";
import { ImageViewer } from "views/ImageViewer";
import { MeasurementView } from "views/MeasurementView";
import { WelcomeScreen } from "./WelcomeScreen";

import { FileUploadProvider } from "contexts";

export const Application = () => {
  const theme = usePreferredMuiTheme();
  const dispatch = useDispatch();
  const [hasLoaded, setHasLoaded] = useState(false);

  const loadDataState = useCallback(async () => {
    const { image, annotationCategories, annotations } =
      (await loadExampleImage(
        colorImage,
        cellPaintingAnnotations as SerializedFileType,
        // imageFile.name points to
        // "/static/media/cell-painting.f118ef087853056f08e6.png"
        "cell-painting.png",
      )) as {
        image: OldImageType;
        annotationCategories: OldCategory[];
        annotations: OldAnnotationType[];
      };

    const dataState = dataConverter_v01v02({
      images: [image],
      oldCategories: [],
      annotations,
      annotationCategories,
    });

    dispatch(dataSlice.actions.initializeState({ data: dataState }));

    dispatch(projectSlice.actions.setProjectImageChannels({ channels: 3 }));
    setHasLoaded(true);
  }, [dispatch]);

  useEffect(() => {
    if (!hasLoaded) {
      loadDataState();
    }
  }, [loadDataState, hasLoaded]);

  return (
    <StyledEngineProvider injectFirst>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <FileUploadProvider>
          <BrowserRouter basename={"/"}>
            <Routes>
              <Route path="/" element={<WelcomeScreen />} />
              <Route path="project" element={<ProjectViewer />} />
              <Route path="imageviewer" element={<ImageViewer />} />
              <Route path="measurements" element={<MeasurementView />} />
            </Routes>
          </BrowserRouter>
        </FileUploadProvider>
      </ThemeProvider>
    </StyledEngineProvider>
  );
};
