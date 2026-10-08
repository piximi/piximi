import { useEffect, useState } from "react";

import { useSelector } from "react-redux";

import { selectThemeMode } from "store/applicationSettings/selectors";

import { getNivoTheme } from "themes/nivoTheme";

import type { PartialTheme } from "@nivo/theming";

export const usePreferredNivoTheme = () => {
  const themeMode = useSelector(selectThemeMode);
  const [theme, setTheme] = useState<PartialTheme>(getNivoTheme(themeMode));

  useEffect(() => {
    setTheme(getNivoTheme(themeMode));
  }, [themeMode]);

  return theme;
};
