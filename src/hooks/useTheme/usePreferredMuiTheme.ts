import { useEffect, useState } from "react";
import { useSelector, useDispatch } from "react-redux";

import useMediaQuery from "@mui/material/useMediaQuery";

import { setThemeMode, themeModeSelector } from "store/application";

import { ThemeMode } from "types";

import { lightTheme, darkTheme } from "themes/muiTheme";

export const usePreferredMuiTheme = () => {
  const dispatch = useDispatch();

  const prefersDarkMode = useMediaQuery("(prefers-color-scheme: dark)");
  const [theme, setTheme] = useState(prefersDarkMode ? darkTheme : lightTheme);

  const themeMode = useSelector(themeModeSelector);

  useEffect(() => {
    dispatch(
      setThemeMode({
        mode: prefersDarkMode ? ThemeMode.Dark : ThemeMode.Light,
      })
    );
  }, [prefersDarkMode, dispatch]);

  useEffect(() => {
    if (themeMode === ThemeMode.Light) {
      setTheme(lightTheme);
    } else {
      setTheme(darkTheme);
    }
  }, [themeMode]);

  return theme;
};
