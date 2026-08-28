import { useRef } from "react";

import type { TextFieldProps } from "@mui/material";
import { TextField } from "@mui/material";

import type { RequireField } from "utils/types";

export type TextFieldWithBlurProps = RequireField<TextFieldProps, "onBlur">;

export const TextFieldWithBlur = (props: TextFieldWithBlurProps) => {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleEnter = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter") {
      inputRef.current?.blur();
    }
  };

  return <TextField {...props} inputRef={inputRef} onKeyDown={handleEnter} />;
};
