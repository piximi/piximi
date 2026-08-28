import type { DividerProps, TypographyProps } from "@mui/material";
import { Divider, Typography } from "@mui/material";

import type { HTMLDataAttributes } from "utils/types";

type DividerHeaderProps = HTMLDataAttributes &
  Pick<DividerProps, "sx" | "textAlign" | "variant" | "children"> & {
    typographyVariant: TypographyProps["variant"];
    textTransform?: TypographyProps["textTransform"];
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
        textTransform={props.textTransform ? props.textTransform : "capitalize"}
      >
        {props.children}
      </Typography>
    </Divider>
  );
};
