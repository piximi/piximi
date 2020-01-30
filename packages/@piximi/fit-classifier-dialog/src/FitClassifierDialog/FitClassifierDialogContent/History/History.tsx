import * as React from "react";
import {VictoryAxis, VictoryChart, VictoryLine, VictoryTheme} from "victory";
import {Grid, Typography} from "@material-ui/core";
import {useStyles} from "./History.css";
import Badge from "@material-ui/core/Badge";

type HistoryProps = {
  status: string;
  lossData: Array<{x: number; y: number}>;
  validationLossData: Array<{x: number; y: number}>;
  accuracyData: Array<{x: number; y: number}>;
  validationAccuracyData: Array<{x: number; y: number}>;
};

const truncate = (x: number) => {
  return parseFloat(x.toString()).toFixed(2);
};

const current = (data: Array<{x: number; y: number}>) => {
  if (data && data.length) {
    return truncate(data[data.length - 1].y).toString();
  } else {
    return "NA";
  }
};

export const History = (props: HistoryProps) => {
  const {
    status,
    lossData,
    validationLossData,
    accuracyData,
    validationAccuracyData
  } = props;

  const classes = useStyles({});

  return (
    <>
      <Grid className={classes.container} container spacing={2}>
        <Grid item xs={4}>
          <Typography classes={{root: classes.typography}}>Loss</Typography>

          <VictoryChart
            height={100}
            padding={0}
            theme={VictoryTheme.material}
            width={400}
          >
            <VictoryAxis
              crossAxis
              standalone={false}
              theme={VictoryTheme.material}
            />

            <VictoryAxis
              crossAxis
              dependentAxis
              standalone={false}
              theme={VictoryTheme.material}
              domain={{y: [0.0, 3.0]}}
            />

            <VictoryLine data={lossData} style={{data: {stroke: "red"}}} />
            <VictoryLine
              data={validationLossData}
              style={{data: {stroke: "green"}}}
            />
          </VictoryChart>
        </Grid>

        <Grid item xs={4}>
          <Typography classes={{root: classes.typography}}>Metrics</Typography>
          <VictoryChart
            height={100}
            padding={0}
            theme={VictoryTheme.material}
            width={400}
          >
            <VictoryAxis
              crossAxis
              standalone={false}
              theme={VictoryTheme.material}
              fixLabelOverlap
            />

            <VictoryAxis
              crossAxis
              dependentAxis
              standalone={false}
              theme={VictoryTheme.material}
              domain={{y: [0.0, 1.0]}}
            />

            <VictoryLine data={accuracyData} style={{data: {stroke: "red"}}} />
            <VictoryLine
              data={validationAccuracyData}
              style={{data: {stroke: "green"}}}
            />
          </VictoryChart>
        </Grid>
      </Grid>

      <Grid className={classes.container} container spacing={2}>
        <Grid item xs={4}>
          <Badge
            badgeContent={`${
              lossData[lossData.length - 1]
                ? truncate(lossData[lossData.length - 1].y)
                : 0.0
            }`}
            color="secondary"
          >
            <div />
          </Badge>
        </Grid>

        <Grid item xs={4}>
          <div />
        </Grid>
      </Grid>
    </>
  );
};
