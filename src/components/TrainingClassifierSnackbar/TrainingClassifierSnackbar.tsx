import React from "react";
import Snackbar from "@material-ui/core/Snackbar";
import Grid from "@material-ui/core/Grid";
import { useStyles } from "./TrainingClassifierSnackbar.css";
import { Alert } from "@material-ui/lab";
import AlertTitle from "@material-ui/lab/AlertTitle";
import { VictoryAxis, VictoryChart, VictoryLine, VictoryTheme } from "victory";
import { useSelector } from "react-redux";
import { epochsSelector } from "../../store/selectors";

const Chart = () => {
  const epochs = useSelector(epochsSelector);

  return (
    <VictoryChart height={100} padding={0} width={200}>
      {/*<VictoryLine*/}
      {/*  data={[*/}
      {/*    { x: 0, y: 0 },*/}
      {/*    { x: 1, y: 1 },*/}
      {/*    { x: 2, y: 2 },*/}
      {/*    { x: 3, y: 3 },*/}
      {/*    { x: 4, y: 4 },*/}
      {/*    { x: 5, y: 5 },*/}
      {/*    { x: 6, y: 6 },*/}
      {/*    { x: 7, y: 7 },*/}
      {/*    { x: 8, y: 8 },*/}
      {/*    { x: 9, y: 9 }*/}
      {/*  ]}*/}
      {/*  style={{*/}
      {/*    data: {*/}
      {/*      stroke: "#c43a31",*/}
      {/*    },*/}
      {/*    labels: {*/}
      {/*      fontSize: 15,*/}
      {/*    }*/}
      {/*  }}*/}
      {/*/>*/}
      <VictoryAxis
        dependentAxis
        style={{
          grid: {
            stroke: "gray",
          },
        }}
        tickLabelComponent={<React.Fragment />}
      />
      <VictoryAxis tickLabelComponent={<React.Fragment />} />
    </VictoryChart>
  );
};

export type TrainingClassifierSnackbarProps = {
  epoch: number;
  loss: number;
  onClose: () => void;
  open: boolean;
};

export const TrainingClassifierSnackbar = ({
  epoch,
  loss,
  onClose,
  open,
}: TrainingClassifierSnackbarProps) => {
  const classes = useStyles();

  const [progress, setProgress] = React.useState(0);

  React.useEffect(() => {
    const timer = setInterval(() => {
      setProgress((oldProgress) => {
        if (oldProgress === 100) {
          return 0;
        }
        const diff = Math.random() * 10;
        return Math.min(oldProgress + diff, 100);
      });
    }, 500);

    return () => {
      clearInterval(timer);
    };
  }, []);

  return (
    <Snackbar
      anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
      className={classes.snackbar}
      onClose={onClose}
      open={open}
    >
      <Alert
        classes={{ message: classes.message }}
        className={classes.snackbar}
        severity="info"
      >
        <AlertTitle>Training classifier…</AlertTitle>
        <div>
          <Grid container className={classes.gridContainer} spacing={2}>
            <Grid item xs={6}>
              <Grid container>
                <Grid className={classes.item} item xs={12}>
                  <Chart />
                </Grid>
              </Grid>
            </Grid>

            <Grid item xs={6}>
              <Grid container>
                <Grid className={classes.item} item xs={12}>
                  <Chart />
                </Grid>
              </Grid>
            </Grid>
          </Grid>
        </div>
      </Alert>
    </Snackbar>
  );
};
