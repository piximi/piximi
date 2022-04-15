import * as React from "react";
import {
  Checkbox,
  FormControlLabel,
  Grid,
  TextField,
  styled,
} from "@mui/material";
import { useDispatch, useSelector } from "react-redux";
import { classifierSlice } from "../../store/slices";
import { rescaleOptionsSelector } from "../../store/selectors/rescaleOptionsSelector";

export const RescalingForm = () => {
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

  const StyledForm = styled("form")({
    // width: '100%',
    display: "flex",
    flexWrap: "wrap",
  });

  const StyledTextField = styled(TextField)(({ theme }) => ({
    // marginLeft: theme.spacing(1),
    marginRight: theme.spacing(1),
    flexBasis: 300,
    width: "100%",
  }));

  return (
    <StyledForm noValidate autoComplete="off">
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
      </Grid>
    </StyledForm>
  );
};
