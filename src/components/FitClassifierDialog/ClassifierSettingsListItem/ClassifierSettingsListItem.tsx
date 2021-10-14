import * as React from "react";
import { createStyles, makeStyles, Theme } from "@material-ui/core/styles";
import { OptimizationGrid } from "./OptimizationGrid";
import {
  Collapse,
  Grid,
  ListItem,
  ListItemIcon,
  ListItemText,
  MenuItem,
  TextField,
} from "@material-ui/core";
import * as _ from "lodash";
import ExpandLessIcon from "@material-ui/icons/ExpandLess";
import ExpandMoreIcon from "@material-ui/icons/ExpandMore";
import { useState } from "react";
import { ClassifierSettingsGrid } from "./ClassifierSettingsGrid/ClassifierSettingsGrid";

const useStyles = makeStyles((theme: Theme) =>
  createStyles({
    expansionPanel: {
      boxShadow: "none",
    },
    leftIcon: {
      marginRight: theme.spacing(1),
    },
    rightIcon: {
      marginLeft: theme.spacing(1),
    },
    button: {
      marginRight: theme.spacing(1),
    },
    grow: {
      flexGrow: 1,
    },
    form: {},
    appBar: {
      position: "relative",
      backgroundColor: "transparent",
      boxShadow: "none",
      borderBottom: "1px solid rgba(0, 0, 0, 0.12)",
    },
    container: {
      // width: '100%',
      display: "flex",
      flexWrap: "wrap",
    },
    root: {
      zIndex: 1100,
    },
    paper: {
      zIndex: 1100,
    },
    paperFullScreen: {
      left: "280px",
    },
    menu: {
      // width: 200,
    },
    textField: {
      // marginLeft: theme.spacing(1),
      marginRight: theme.spacing(1),
      flexBasis: 300,
      width: "100%",
    },
    title: {
      marginLeft: theme.spacing(2),
      flex: 1,
    },
    heading: {
      fontSize: theme.typography.pxToRem(15),
      fontWeight: theme.typography.fontWeightRegular,
    },
  })
);

type ClassifierSettingsListItemProps = {
  batchSize: number;
  epochs: number;
  learningRate: number;
  lossFunction: String;
  onBatchSizeChange: (event: React.FormEvent<EventTarget>) => void;
  onLearningRateChange: (event: React.FormEvent<EventTarget>) => void;
  onEpochsChange: (event: React.FormEvent<EventTarget>) => void;
  onLossFunctionChange: (event: React.FormEvent<EventTarget>) => void;
  onOptimizationAlgorithmChange: (event: React.FormEvent<EventTarget>) => void;
  optimizationAlgorithm: string;
};

export const ClassifierSettingsListItem = ({
  batchSize,
  epochs,
  learningRate,
  onBatchSizeChange,
  onLearningRateChange,
  lossFunction,
  onEpochsChange,
  onLossFunctionChange,
  onOptimizationAlgorithmChange,
  optimizationAlgorithm,
}: ClassifierSettingsListItemProps) => {
  const [collapsedClassifierSettingsList, setCollapsedClassifierSettingsList] =
    useState<boolean>(false);

  const onClasssifierSettingsListClick = () => {
    setCollapsedClassifierSettingsList(!collapsedClassifierSettingsList);
  };

  interface State {
    lossFunction: string;
    optimizationAlgorithm: string;
  }

  const [values, setValues] = React.useState<State>({
    lossFunction: "meanSquaredError",
    optimizationAlgorithm: "adam",
  });

  const onChange =
    (name: keyof State) => (event: React.ChangeEvent<HTMLInputElement>) => {
      setValues({ ...values, [name]: event.target.value });
    };

  const classes = useStyles({});

  return (
    <>
      <ListItem
        button
        onClick={onClasssifierSettingsListClick}
        style={{ padding: "12px 0px" }}
      >
        <ListItemIcon>
          {collapsedClassifierSettingsList ? (
            <ExpandLessIcon />
          ) : (
            <ExpandMoreIcon />
          )}
        </ListItemIcon>

        <ListItemText
          primary="Classifier Settings"
          style={{ fontSize: "20px" }}
        />
      </ListItem>
      <Collapse
        in={collapsedClassifierSettingsList}
        timeout="auto"
        unmountOnExit
      >
        <form className={classes.container} noValidate autoComplete="off">
          <OptimizationGrid />

          <ClassifierSettingsGrid />
        </form>
      </Collapse>
    </>
  );
};
