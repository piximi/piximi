import React from "react";
import {
  Divider,
  Typography,
  DividerProps,
  TypographyProps,
} from "@mui/material";

type DividerHeaderProps = Pick<
  DividerProps,
  "sx" | "textAlign" | "variant" | "children"
> & {
  typographyVariant: TypographyProps["variant"];
  textTransform?: TypographyProps["textTransform"];
};

export const DividerHeader = (props: DividerHeaderProps) => {
  return (
    <Divider sx={props.sx} textAlign={props.textAlign} variant={props.variant}>
      <Typography
        variant={props.typographyVariant}
        textTransform={props.textTransform ? props.textTransform : "capitalize"}
      >
        {props.children}
      </Typography>
    </Divider>
  );
};
