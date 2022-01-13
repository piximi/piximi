import { ThemeProvider } from "@mui/material/styles";
import { ImageViewer } from "../ImageViewer";
import { theme } from "./theme";
import { darktheme } from "./darktheme";

export const AnnotatorView = () => {
  return (
    // <ThemeProvider theme={theme}>
    <ImageViewer />
    // </ThemeProvider>
  );
};
