import { createTheme } from "@mui/material/styles";

export const lightTheme = createTheme({
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

export const darkTheme = createTheme({
  components: {
    MuiDialog: {
      styleOverrides: {
        paper: {
          backgroundImage: "none",
        },
      },
    },
    MuiDrawer: {
      styleOverrides: {
        paperAnchorDockedLeft: {
          borderRight: "1px solid rgba(16, 16, 16)",
        },
        paperAnchorDockedRight: {
          borderLeft: "1px solid rgba(16, 16, 16)",
        },
        paper: {
          // boxShadow: "inset 0 0 16px #000000",
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
      primary: "rgba(200, 200, 200)",
    },
    mode: "dark",
  },
});
