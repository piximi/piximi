import type { ThemeOptions } from "@mui/material/styles";
import { createTheme } from "@mui/material/styles";

declare module "@mui/material/styles" {
  interface CssThemeVariables {
    enabled: true;
  }
}

const sharedComponentThemes: ThemeOptions["components"] = {
  MuiButtonBase: {
    defaultProps: {
      disableRipple: true,
    },
    styleOverrides: {
      root: {
        borderRadius: 8,
      },
    },
  },
  MuiIconButton: {
    styleOverrides: {
      root: {
        borderRadius: 8,
      },
    },
  },
  MuiDialog: {
    styleOverrides: {
      paper: {
        borderRadius: 8,
        backgroundImage: "none",
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
  MuiTooltip: {
    styleOverrides: {
      tooltip: {
        paddingBlock: "2px",
        paddingInline: "4px",
        backgroundColor: "var(--mui-palette-background-paper)",
        border: "1px solid var(--mui-palette-text-primary)",
        color: "var(--mui-palette-text-primary)",
      },
    },
  },
};

export const lightTheme = createTheme({
  cssVariables: true,
  palette: {
    contrastThreshold: 4.5, // contrast ration needs to be 4.5:1 for accessibility
  },
  components: sharedComponentThemes,
});

export const darkTheme = createTheme({
  cssVariables: true,
  components: {
    ...sharedComponentThemes,
    MuiDrawer: {
      styleOverrides: {
        paperAnchorDockedLeft: {
          borderRight: "1px solid rgba(16, 16, 16)",
        },
        paperAnchorDockedRight: {
          borderLeft: "1px solid rgba(16, 16, 16)",
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

    // MuiSlider: {
    //   styleOverrides: {
    //     rail: {
    //       color: "rgba(73, 73, 73)",
    //     },
    //     thumb: {
    //       color: "rgba(201, 201, 201)",
    //     },
    //     track: {
    //       color: "rgba(159, 159, 159)",
    //     },
    //   },
    // },
  },
  palette: {
    contrastThreshold: 4.5, // contrast ration needs to be 4.5:1 for accessibility
    action: {
      active: "rgba(200, 200, 200)",
    },
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
