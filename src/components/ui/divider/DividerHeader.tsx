import React from "react";
import {
  Divider,
  Typography,
  DividerProps,
  TypographyProps,
} from "@mui/material";
import { HTMLDataAttributes } from "utils/common/types";

type DividerHeaderProps = HTMLDataAttributes &
  Pick<DividerProps, "sx" | "textAlign" | "variant" | "children"> & {
    typographyVariant: TypographyProps["variant"];
  };

export const DividerHeader = (props: DividerHeaderProps) => {
  return (
    <Divider
      data-help={props["data-help"]}
      sx={props.sx}
      textAlign={props.textAlign}
      variant={props.variant}
    >
      <Typography
        variant={props.typographyVariant}
        sx={{ textTransform: "capitalize" }}
      >
        {props.children}
      </Typography>
    </Divider>
  );
};
