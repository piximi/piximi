import { useEffect, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import useMediaQuery from "@mui/material/useMediaQuery";
import { ThemeMode } from "types/ThemeMode";
import { themeModeSelector } from "store/selectors/themeModeSelector";
import { setThemeMode } from "store/slices";
import { lightTheme, darkTheme } from "theme";

export const usePreferredTheme = () => {
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
