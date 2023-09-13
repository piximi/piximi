import { Divider, DividerProps, styled } from "@mui/material";

export const StyledDivider = styled(Divider)<DividerProps>(({ theme }) => ({
  borderColor: theme.palette.text.primary,
}));
