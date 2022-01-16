import { createTheme } from "@mui/material/styles";

/*
This file is the old "theme.ts" file, and is no longer used.
We do eventually want to support a toggle that will enable a dark mode,
so keeping this around until that is implemented.  -- Nodar
*/

export const darktheme = createTheme({
  components: {
    MuiDrawer: {
      styleOverrides: {
        paperAnchorDockedLeft: {
          borderRight: "1px solid rgba(16, 16, 16)",
        },
        paperAnchorDockedRight: {
          borderLeft: "1px solid rgba(16, 16, 16)",
        },
        paper: {
          boxShadow: "inset 0 0 16px #000000",
        },
      },
    },
    MuiListItem: {
      styleOverrides: {
        root: {
          "&.Mui-selected": {
            backgroundColor: "rgba(60, 61, 62)",
          },
        },
      },
    },
    MuiListItemIcon: {
      styleOverrides: {
        root: {
          minWidth: 36,
        },
      },
    },
    MuiSlider: {
      styleOverrides: {
        rail: {
          color: "rgba(73, 73, 73)",
        },
        thumb: {
          color: "rgba(201, 201, 201)",
        },
        track: {
          color: "rgba(159, 159, 159)",
        },
      },
    },
  },
  palette: {
    background: {
      paper: "rgba(40, 40, 40)",
      default: "rgba(50, 50, 50)",
    },
    divider: "rgba(72, 72, 72)",
    text: {
      primary: "rgba(190, 190, 190)",
    },
    mode: "dark",
  },
});
