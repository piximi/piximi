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
    marginLeft: theme.spacing(32),
    transition: theme.transitions.create(["margin", "width"], {
      duration: theme.transitions.duration.enteringScreen,
      easing: theme.transitions.easing.easeOut,
    }),
    width: `calc(100% - ${theme.spacing(32)}px)`,
  },
  card: {},
  classifierSettingsDialogContent: {
    marginTop: theme.spacing(8),
  },
  chip: {
    height: "20px",
    borderWidth: "2px",
    fontSize: "0.875rem",
    color: "white",
  },
  colorPicker: {
    margin: "16px",
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
    width: theme.spacing(32),
  },
  drawerHeader: {
    ...theme.mixins.toolbar,
    alignItems: "center",
    display: "flex",
    paddingLeft: theme.spacing(3),
  },
  drawerPaper: {
    width: theme.spacing(32),
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
  imageCanvasContainer: {
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center",
  },
  imageDialogAppBar: {
    zIndex: theme.zIndex.drawer + 1,
  },
  imageDialogToolboxBar: {
    paddingBottom: "50px;",
  },
  imageDialogContent: {
    paddingBottom: theme.spacing(12),
    paddingTop: theme.spacing(12),
  },
  imageSelected: {
    border: "solid 2px blue",
    borderRadius: "3px",
  },
  imageUnselected: {
    border: "none",
  },
  main: {
    flexGrow: 1,
    marginLeft: -theme.spacing(32),
    padding: theme.spacing(3),
    transition: theme.transitions.create("margin", {
      duration: theme.transitions.duration.leavingScreen,
      easing: theme.transitions.easing.sharp,
    }),
  },
  mainShift: {
    marginLeft: theme.spacing(32),
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
