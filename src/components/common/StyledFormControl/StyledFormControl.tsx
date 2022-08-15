import { styled } from "@mui/material/styles";
import FormControl, { FormControlProps } from "@mui/material/FormControl";

// type StyledFormControlProps = FormControlProps & { component: string };

export const StyledFormControl = styled(FormControl)<FormControlProps>(
  ({ theme }) => ({
    display: "flex",
    flexWrap: "wrap",
    margin: theme.spacing(1),
    width: "100%",
    minWidth: 120,
  })
);
