import * as React from "react";
import { createStyles, makeStyles, Theme } from "@material-ui/core/styles";
import { Grid, MenuItem, TextField } from "@material-ui/core";
import * as _ from "lodash";

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

type FormProps = {
  lowerPercentile: number;
  closeDialog: () => void;
  upperPercentile: number;
  onLowerPercentileChange: (event: React.FormEvent<EventTarget>) => void;
  onUpperPercentileChange: (event: React.FormEvent<EventTarget>) => void;
  openedDialog: boolean;
};

export const RescalingForm = (props: FormProps) => {
  const {
    lowerPercentile,
    closeDialog,
    upperPercentile,
    onLowerPercentileChange,
    onUpperPercentileChange,
    openedDialog,
  } = props;

  const classes = useStyles({});

  return (
    <form className={classes.container} noValidate autoComplete="off">
      <Grid container spacing={2}>
        <Grid item xs={2}>
          <TextField
            id="lower-percentile"
            label="Lower Percentile"
            className={classes.textField}
            value={lowerPercentile}
            onChange={onLowerPercentileChange}
            type="number"
            margin="normal"
            defaultValue="0"
          />
        </Grid>

        <Grid item xs={2}>
          <TextField
            id="upper-percentile"
            label="Upper Percentile"
            className={classes.textField}
            value={upperPercentile}
            onChange={onUpperPercentileChange}
            margin="normal"
            type="number"
            defaultValue="100"
          />
        </Grid>
      </Grid>
    </form>
  );
};
