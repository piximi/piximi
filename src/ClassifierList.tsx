import ListItem from "@material-ui/core/ListItem";
import ListItemIcon from "@material-ui/core/ListItemIcon";
import LabelImportantIcon from "@material-ui/icons/LabelImportant";
import ListItemText from "@material-ui/core/ListItemText";
import BarChartIcon from "@material-ui/icons/BarChart";
import ScatterPlotIcon from "@material-ui/icons/ScatterPlot";
import React from "react";
import List from "@material-ui/core/List";
import ExpandLessIcon from "@material-ui/icons/ExpandLess";
import ExpandMoreIcon from "@material-ui/icons/ExpandMore";
import Collapse from "@material-ui/core/Collapse";
import IconButton from "@material-ui/core/IconButton";
import SettingsIcon from "@material-ui/icons/Settings";
import { ClassifierSettingsDialog } from "./ClassifierSettingsDialog";
import Tooltip from "@material-ui/core/Tooltip";
import Alert from "@material-ui/lab/Alert";
import AlertTitle from "@material-ui/lab/AlertTitle";
import Snackbar from "@material-ui/core/Snackbar";
import ListItemSecondaryAction from "@material-ui/core/ListItemSecondaryAction";
import { LinearProgress } from "@material-ui/core";
import Grid from "@material-ui/core/Grid";
import { useStyles } from "./index.css";

export const ClassifierList = () => {
  const [collapsed, setCollapsed] = React.useState(true);

  const onCollapseClick = () => {
    setCollapsed(!collapsed);
  };

  const [openFitSnackbar, setOpenFitSnackbar] = React.useState(false);

  const onOpenFitSnackbar = () => {
    setOpenFitSnackbar(true);
  };

  const onCloseFitSnackbar = () => {
    setOpenFitSnackbar(false);
  };

  const [
    openClassifierSettingsDialog,
    setOpenClassifierSettingsDialog,
  ] = React.useState(false);

  const onOpenClassifierSettingsDialog = () => {
    setOpenClassifierSettingsDialog(true);
  };

  const onCloseClassifierSettingsDialog = () => {
    setOpenClassifierSettingsDialog(false);
  };

  const onFitClick = () => {
    onOpenFitSnackbar();
  };

  const classes = useStyles();

  return (
    <React.Fragment>
      <List dense>
        <ListItem button dense onClick={onCollapseClick}>
          <ListItemIcon>
            {collapsed ? <ExpandLessIcon /> : <ExpandMoreIcon />}
          </ListItemIcon>

          <ListItemText primary="Classifier" />

          <ListItemSecondaryAction>
            <Tooltip title="Classifier settings">
              <IconButton edge="end" onClick={onOpenClassifierSettingsDialog}>
                <SettingsIcon />
              </IconButton>
            </Tooltip>
          </ListItemSecondaryAction>
        </ListItem>

        <Collapse in={collapsed} timeout="auto" unmountOnExit>
          <List component="div" dense disablePadding>
            <ListItem button onClick={onFitClick}>
              <ListItemIcon>
                <ScatterPlotIcon />
              </ListItemIcon>

              <ListItemText primary="Fit" />
            </ListItem>

            <ListItem button disabled>
              <ListItemIcon>
                <BarChartIcon />
              </ListItemIcon>

              <ListItemText primary="Evaluate" />
            </ListItem>

            <ListItem button disabled>
              <ListItemIcon>
                <LabelImportantIcon />
              </ListItemIcon>

              <ListItemText primary="Predict" />
            </ListItem>
          </List>
        </Collapse>
      </List>

      <ClassifierSettingsDialog
        onClose={onCloseClassifierSettingsDialog}
        open={openClassifierSettingsDialog}
      />

      <Snackbar
        anchorOrigin={{
          vertical: "bottom",
          horizontal: "center",
        }}
        onClose={onCloseFitSnackbar}
        open={openFitSnackbar}
      >
        <Alert
          className={classes.alert}
          onClose={onCloseFitSnackbar}
          severity="info"
        >
          <AlertTitle>Training…</AlertTitle>
          <Grid container>
            <Grid item xs={12}>
              <LinearProgress className={classes.progress} />
            </Grid>
          </Grid>
        </Alert>
      </Snackbar>
    </React.Fragment>
  );
};
