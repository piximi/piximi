import { useMemo } from "react";

import { useSelector } from "react-redux";

import { selectThemeMode } from "store/applicationSettings/selectors";

import { getNivoTheme } from "themes/nivoTheme";

export const usePreferredNivoTheme = () => {
  const themeMode = useSelector(selectThemeMode);

  const theme = useMemo(() => getNivoTheme(themeMode), [themeMode]);

  return theme;
};
