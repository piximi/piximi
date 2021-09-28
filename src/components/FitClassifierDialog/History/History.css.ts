import { createStyles } from "@material-ui/styles";
import { Theme } from "@material-ui/core";

export const styles = (theme: Theme) =>
  createStyles({
    typography: {
      color: "rgba(0, 0, 0, 0.54)",
      padding: 0,
      fontSize: "1rem",
      fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
      fontWeight: 400,
      lineHeight: 1,
      letterSpacing: "0.00938em",
      margin: "16px 0",
      transform: "translate(0, 1.5px) scale(0.75)",
      transformOrigin: "top left",
    },
  });
