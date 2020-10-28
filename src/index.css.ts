import { makeStyles } from "@material-ui/core/styles";

export const useStyles = makeStyles((theme) => ({
  alert: {
    width: theme.spacing(64),
  },
  appBar: {
    transition: theme.transitions.create(["margin", "width"], {
      duration: theme.transitions.duration.leavingScreen,
      easing: theme.transitions.easing.sharp,
    }),
  },
  appBarShift: {
    marginLeft: theme.spacing(30),
    transition: theme.transitions.create(["margin", "width"], {
      duration: theme.transitions.duration.enteringScreen,
      easing: theme.transitions.easing.easeOut,
    }),
    width: `calc(100% - ${theme.spacing(30)}px)`,
  },
  card: {},
  classifierSettingsDialogContent: {
    marginTop: theme.spacing(8),
  },
  container: {
    paddingBottom: theme.spacing(8),
    paddingTop: theme.spacing(8),
  },
  createCategoryDialogContent: {
    paddingLeft: "0 !important",
  },
  createCategoryDialogGrid: {
    margin: theme.spacing(1),
  },
  createCategoryDialogItem: {
    // paddingLeft: "0 !important",
  },
  drawer: {
    flexShrink: 0,
    width: theme.spacing(30),
  },
  drawerHeader: {
    ...theme.mixins.toolbar,
    alignItems: "center",
    display: "flex",
    justifyContent: "flex-end",
    padding: theme.spacing(0, 1),
  },
  drawerPaper: {
    width: theme.spacing(30),
  },
  fileInput: {
    display: "none",
  },
  gridList: {
    transform: "translateZ(0)",
  },
  gridTileBar: {
    background:
      "linear-gradient(to bottom, rgba(0,0,0,0.7) 0%, rgba(0,0,0,0.3) 50%, rgba(0,0,0,0) 100%)",
  },
  gridTileBarIconButton: {
    color: "white",
  },
  imageDialogAppBar: {
    zIndex: theme.zIndex.drawer + 1,
  },
  imageDialogContent: {
    paddingBottom: theme.spacing(12),
    paddingTop: theme.spacing(12),
  },
  main: {
    flexGrow: 1,
    marginLeft: -theme.spacing(30),
    padding: theme.spacing(3),
    transition: theme.transitions.create("margin", {
      duration: theme.transitions.duration.leavingScreen,
      easing: theme.transitions.easing.sharp,
    }),
  },
  mainShift: {
    marginLeft: 0,
    transition: theme.transitions.create("margin", {
      duration: theme.transitions.duration.enteringScreen,
      easing: theme.transitions.easing.easeOut,
    }),
  },
  media: {},
  progress: {
    width: "100%",
  },
  settingsDialogAppBar: {},
  slider: {
    padding: theme.spacing(3),
  },
  sliderInput: {
    width: 42,
  },
}));
