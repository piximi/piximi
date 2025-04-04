import React, { useRef } from "react";
import { TextField, TextFieldProps } from "@mui/material";
import { RequireField } from "utils/common/types";

export const TextFieldWithBlur = (
  props: RequireField<TextFieldProps, "onBlur">,
) => {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleEnter = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter") {
      inputRef.current?.blur();
    }
  };

  return <TextField {...props} inputRef={inputRef} onKeyDown={handleEnter} />;
};
