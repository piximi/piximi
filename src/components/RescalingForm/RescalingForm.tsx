import * as React from "react";
import { createStyles, makeStyles } from "@mui/styles";
import {
  Checkbox,
  FormControlLabel,
  Grid,
  TextField,
  Theme,
} from "@mui/material";
import { useDispatch, useSelector } from "react-redux";
import { classifierSlice } from "../../store/slices";
import { rescaleOptionsSelector } from "../../store/selectors/rescaleOptionsSelector";

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

export const RescalingForm = () => {
  const classes = useStyles({});

  const rescaleOptions = useSelector(rescaleOptionsSelector);
  const dispatch = useDispatch();

  const [disabled, setDisabled] = React.useState<boolean>(
    !rescaleOptions.rescale
  );

  const onCheckboxChange = () => {
    setDisabled(!disabled);
    dispatch(
      classifierSlice.actions.updateRescaleOptions({
        rescaleOptions: { ...rescaleOptions, rescale: !rescaleOptions.rescale },
      })
    );
  };

  const onMaxChange = (event: React.FormEvent<EventTarget>) => {
    const target = event.target as HTMLInputElement;
    var value = Number(target.value);
    if (!value) return;
    dispatch(
      classifierSlice.actions.updateRescaleOptions({
        rescaleOptions: {
          ...rescaleOptions,
          rescaleMinMax: { ...rescaleOptions.rescaleMinMax, max: value },
        },
      })
    );
  };

  const onMinChange = (event: React.FormEvent<EventTarget>) => {
    const target = event.target as HTMLInputElement;
    var value = Number(target.value);
    if (!value) return;
    dispatch(
      classifierSlice.actions.updateRescaleOptions({
        rescaleOptions: {
          ...rescaleOptions,
          rescaleMinMax: { ...rescaleOptions.rescaleMinMax, min: value },
        },
      })
    );
  };

  return (
    <form className={classes.container} noValidate autoComplete="off">
      <Grid container spacing={2}>
        <Grid item xs={2}>
          <FormControlLabel
            control={
              <Checkbox
                checked={rescaleOptions.rescale}
                onChange={onCheckboxChange}
                name="rescale"
                color="primary"
              />
            }
            label="Rescale pixels?"
          />
        </Grid>
        <Grid item xs={2}>
          <TextField
            id="minimum"
            label="Minimum pixel value"
            className={classes.textField}
            disabled={disabled}
            value={rescaleOptions.rescaleMinMax.min}
            onChange={onMinChange}
            type="number"
            margin="normal"
            defaultValue="0"
          />
        </Grid>

        <Grid item xs={2}>
          <TextField
            id="maximum"
            label="Maximum pixel value"
            className={classes.textField}
            disabled={disabled}
            value={rescaleOptions.rescaleMinMax.max}
            onChange={onMaxChange}
            margin="normal"
            type="number"
            defaultValue="100"
          />
        </Grid>
      </Grid>
    </form>
  );
};
