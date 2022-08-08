import { FormControl, FormControlProps, styled } from "@mui/material";

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
