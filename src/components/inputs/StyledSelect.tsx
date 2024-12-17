import { Select, SelectProps, styled } from "@mui/material";
import { CSSProperties } from "@mui/material/styles/createMixins";

export type StyledSelectProps = SelectProps &
  Partial<Pick<CSSProperties, "fontSize">>;
export const StyledSelect = styled(Select, {
  shouldForwardProp: (prop) => prop !== "maxWidth" && prop !== "fontSize",
})<StyledSelectProps>(({ fontSize }) => ({
  fontSize: fontSize ?? "",
  "& .MuiInputBase-root": {
    fontSize: fontSize ?? "",
  },
}));
