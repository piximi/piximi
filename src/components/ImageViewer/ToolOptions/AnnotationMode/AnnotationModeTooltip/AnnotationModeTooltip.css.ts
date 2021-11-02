import { makeStyles } from "@mui/styles";
import { Theme } from "@mui/material";

export const useStyles = makeStyles((theme: Theme) => ({
  tooltip: {
    // backgroundColor: "#f5f5f9",
    border: "1px solid #dadde9",
    // color: "rgba(0, 0, 0, 0.87)",
    // fontSize: theme.typography.pxToRem(12),
    marginLeft: -100,
    width: 300,
  },
}));
