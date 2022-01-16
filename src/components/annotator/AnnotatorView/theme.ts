import { createTheme } from "@mui/material/styles";

export const theme = createTheme({
  components: {
    MuiListItemIcon: {
      styleOverrides: {
        root: {
          minWidth: 36,
        },
      },
    },
  },
});
