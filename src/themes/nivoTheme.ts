import { Theme } from "@nivo/core";
import { ThemeMode } from "types/ThemeMode";
import { lightTheme, darkTheme } from "./muiTheme";

export const getNivoTheme = (themeMode: ThemeMode) => {
  const theme = themeMode === ThemeMode.Light ? lightTheme : darkTheme;

  const nivoTheme: Theme = {
    fontSize: 14,
    axis: {
      legend: {
        text: {
          fontSize: 16,
          fill: theme.palette.text.primary,
        },
      },
      ticks: {
        line: {
          stroke: theme.palette.text.primary,
          strokeWidth: 1,
        },
        text: {
          fontSize: 14,
          fill: theme.palette.text.primary,
        },
      },
    },
    legends: {
      text: {
        fill: theme.palette.text.primary,
      },
    },
  };

  return nivoTheme;
};
