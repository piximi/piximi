import * as React from "react";
import { createStyles, makeStyles, Theme } from "@material-ui/core/styles";
import { Grid, MenuItem, TextField } from "@material-ui/core";
import * as _ from "lodash";
import { optimizationAlgorithmSelector } from "../../../../store/selectors/optimizationAlgorithmSelector";
import { useDispatch, useSelector } from "react-redux";
import { classifierSlice } from "../../../../store/slices";
import { OptimizationAlgorithm } from "../../../../types/OptimizationAlgorithm";
import { learningRateSelector } from "../../../../store/selectors/learningRateSelector";
import { useState } from "react";

const useStyles = makeStyles((theme: Theme) =>
  createStyles({
    menu: {
      // width: 200,
    },
    textField: {
      // marginLeft: theme.spacing(1),
      marginRight: theme.spacing(1),
      flexBasis: 300,
      width: "100%",
    },
    container: {
      width: "100%",
      display: "flex",
      flexWrap: "wrap",
    },
  })
);

export const OptimizationGrid = () => {
  const dispatch = useDispatch();

  const classes = useStyles({});

  return <></>;
};
