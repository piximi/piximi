import { styled } from "@mui/material";
import Select, { SelectProps } from "@mui/material/Select";
import { CSSProperties } from "@mui/material/styles/createMixins";

export type StyledSelectProps = SelectProps &
  Partial<Pick<CSSProperties, "fontSize">>;
export const StyledSelect = styled(Select, {
  shouldForwardProp: (prop) => prop !== "maxWidth" && prop !== "fontSize",
})<StyledSelectProps>(({ fontSize, theme }) => ({
  fontSize: fontSize ?? "",
  "& .MuiInputBase-root": {
    fontSize: fontSize ?? "",
  },
}));
