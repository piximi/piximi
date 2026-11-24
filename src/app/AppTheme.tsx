import { CssBaseline } from "@mui/material";
import { StyledEngineProvider, ThemeProvider } from "@mui/material/styles";

import { usePreferredMuiTheme } from "hooks";

import type { ReactNode } from "react";

/* Sits above the backend boot so its connecting and error screens are themed too. */
export const AppTheme = ({ children }: { children: ReactNode }) => {
  const theme = usePreferredMuiTheme();
  return (
    <StyledEngineProvider injectFirst>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        {children}
      </ThemeProvider>
    </StyledEngineProvider>
  );
};
