import React from "react";
import { TextFieldWithBlur, TextFieldWithBlurProps } from "./TextFieldWithBlur";

export const ModelSettingsTextField = (props: TextFieldWithBlurProps) => {
  return (
    <TextFieldWithBlur
      slotProps={{
        inputLabel: { sx: { top: "-2px" } },
      }}
      sx={(theme) => ({
        width: "7ch",
        input: {
          py: 0.5,
          fontSize: theme.typography.body2.fontSize,
          minHeight: "1rem",
        },
      })}
      {...props}
    />
  );
};
