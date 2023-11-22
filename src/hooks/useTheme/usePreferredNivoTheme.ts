import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { Theme } from "@nivo/core";

import { selectThemeMode } from "store/applicationSettings";

import { getNivoTheme } from "themes/nivoTheme";

export const usePreferredNivoTheme = () => {
  const themeMode = useSelector(selectThemeMode);
  const [theme, setTheme] = useState<Theme>(getNivoTheme(themeMode));

  useEffect(() => {
    setTheme(getNivoTheme(themeMode));
  }, [themeMode]);

  return theme;
};
