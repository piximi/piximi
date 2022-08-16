import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { Theme } from "@nivo/core";

import { themeModeSelector } from "store/application";

import { getNivoTheme } from "themes/nivoTheme";

export const usePreferredNivoTheme = () => {
  const themeMode = useSelector(themeModeSelector);
  const [theme, setTheme] = useState<Theme>(getNivoTheme(themeMode));

  useEffect(() => {
    setTheme(getNivoTheme(themeMode));
  }, [themeMode]);

  return theme;
};
