import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { Theme } from "@nivo/core";

import { getNivoTheme } from "themes/nivoTheme";
import { selectThemeMode } from "store/applicationSettings/selectors";

export const usePreferredNivoTheme = () => {
  const themeMode = useSelector(selectThemeMode);
  const [theme, setTheme] = useState<Theme>(getNivoTheme(themeMode));

  useEffect(() => {
    setTheme(getNivoTheme(themeMode));
  }, [themeMode]);

  return theme;
};
