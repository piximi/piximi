import { makeStyles } from "@material-ui/core/styles";

export const useStyles = makeStyles((theme) => ({
  appBar: {
    borderBottom: "1px solid rgba(0, 0, 0, 0.12)",
    boxShadow: "none",
  },
  grow: {
    flexGrow: 1,
  },
}));
