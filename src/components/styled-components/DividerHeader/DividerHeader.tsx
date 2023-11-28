import {
  Divider,
  Typography,
  DividerProps,
  TypographyProps,
} from "@mui/material";
import React from "react";

type DividerHeaderProps = Pick<
  DividerProps,
  "sx" | "textAlign" | "variant" | "children"
> & {
  typographyVariant: TypographyProps["variant"];
};

export const DividerHeader = (props: DividerHeaderProps) => {
  return (
    <Divider sx={props.sx} textAlign={props.textAlign} variant={props.variant}>
      <Typography
        variant={props.typographyVariant}
        sx={{ textTransform: "uppercase" }}
      >
        {props.children}
      </Typography>
    </Divider>
  );
};
