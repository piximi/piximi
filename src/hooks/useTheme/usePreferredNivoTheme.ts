import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { themeModeSelector } from "store/selectors/themeModeSelector";
import { getNivoTheme } from "themes/nivoTheme";
import { Theme } from "@nivo/core";

export const usePreferredNivoTheme = () => {
  const themeMode = useSelector(themeModeSelector);
  const [theme, setTheme] = useState<Theme>(getNivoTheme(themeMode));

  useEffect(() => {
    setTheme(getNivoTheme(themeMode));
  }, [themeMode]);

  return theme;
};
