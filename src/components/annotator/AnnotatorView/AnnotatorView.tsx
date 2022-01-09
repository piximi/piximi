import { ThemeProvider } from "@mui/material/styles";
import { ImageViewer } from "../ImageViewer";
import { theme } from "./theme";

export const AnnotatorView = () => {
  return (
    <ThemeProvider theme={theme}>
      <ImageViewer />
    </ThemeProvider>
  );
};
