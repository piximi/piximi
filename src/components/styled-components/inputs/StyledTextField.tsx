import { styled } from "@mui/material";
import TextField, { TextFieldProps } from "@mui/material/TextField";
import { CSSProperties } from "@mui/material/styles/createMixins";

export type StyledTextFieldProps = TextFieldProps &
  Partial<Pick<CSSProperties, "maxWidth" | "fontSize" | "textAlign">>;
export const StyledTextField = styled(TextField, {
  shouldForwardProp: (prop) =>
    prop !== "maxWidth" && prop !== "fontSize" && prop !== "textAlign",
})<StyledTextFieldProps>(({ maxWidth, fontSize, textAlign, theme }) => ({
  maxWidth: maxWidth ?? "",
  fontSize: fontSize ?? "",
  "& .MuiInputBase-root": {
    fontSize: fontSize ?? "",
  },
  "& input": {
    textAlign: textAlign ?? "",
  },
}));
