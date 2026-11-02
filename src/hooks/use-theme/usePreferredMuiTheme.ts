import { useLayoutEffect } from "react";

import { useSelector, useDispatch } from "react-redux";

import { useMediaQuery } from "@mui/material";

import { applicationSettingsSlice } from "store/applicationSettings";
import { selectThemeMode } from "store/applicationSettings/selectors";

import { lightTheme, darkTheme } from "themes/muiTheme";
import { ThemeMode } from "themes/enums";

export const usePreferredMuiTheme = () => {
  const dispatch = useDispatch();

  const prefersDarkMode = useMediaQuery("(prefers-color-scheme: dark)");

  const themeMode = useSelector(selectThemeMode);

  const theme = themeMode === ThemeMode.Light ? lightTheme : darkTheme;

  useLayoutEffect(() => {
    dispatch(
      applicationSettingsSlice.actions.setThemeMode({
        mode: prefersDarkMode ? ThemeMode.Dark : ThemeMode.Light,
      }),
    );
  }, [prefersDarkMode, dispatch]);

  return theme;
};
