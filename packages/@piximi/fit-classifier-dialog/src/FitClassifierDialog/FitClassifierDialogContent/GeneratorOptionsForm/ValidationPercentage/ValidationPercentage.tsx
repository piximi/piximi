import Grid from "@material-ui/core/Grid";
import * as React from "react";
import Slider from "@material-ui/core/Slider";
import Typography from "@material-ui/core/Typography";
import Input from "@material-ui/core/Input";
import {useDispatch, useSelector} from "react-redux";
import {validationPercentageSelector} from "@piximi/store";
import {useCallback} from "react";
import {updateValidationPercentageAction} from "@piximi/store/dist";

export const ValidationPercentage = () => {
  const dispatch = useDispatch();

  const onChange = useCallback(
    (event: any, value: number | number[]) => {
      const payload = {validationPercentage: Number(value)};

      dispatch(updateValidationPercentageAction(payload));
    },
    [dispatch]
  );

  const validationPercentage = useSelector(validationPercentageSelector);

  const toString = (): string => {
    return `${validationPercentage}`;
  };

  return (
    <Grid container>
      <Typography id="validation-percentage" gutterBottom>
        Validation percentage
      </Typography>

      <Grid container spacing={2} alignItems="center">
        <Grid item xs={10}>
          <Slider
            aria-labelledby="validation-percentage"
            defaultValue={validationPercentage}
            max={1.0}
            min={0.0}
            onChange={onChange}
            step={0.05}
            valueLabelDisplay="auto"
          />
        </Grid>

        <Grid item xs={2}>
          <Input value={toString()} margin="dense" />
        </Grid>
      </Grid>
    </Grid>
  );
};
