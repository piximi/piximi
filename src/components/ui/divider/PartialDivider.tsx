import React, { CSSProperties } from "react";
import {
  Box,
  Typography,
  TypographyProps,
  SxProps,
  Theme,
} from "@mui/material";

export const PartialDivider = ({
  headerText,
  containerStyle,
  typographyVariant,
  textTransform,
  indentPercentage = 7,
  color,
}: {
  headerText: string;
  containerStyle?: SxProps<Theme>;
  typographyVariant?: TypographyProps["variant"];
  textTransform?: TypographyProps["textTransform"];
  indentPercentage?: number;
  color?: CSSProperties["color"];
}) => {
  return (
    <Box
      sx={{ display: "flex", alignItems: "center", my: 1, ...containerStyle }}
    >
      <Box
        sx={(theme) => ({
          height: 0,
          borderBottom: `thin solid ${theme.palette.divider}`,
          width: `${indentPercentage}%`,
        })}
      />
      <Typography
        variant={typographyVariant ?? "body2"}
        textTransform={textTransform ?? "capitalize"}
        sx={{
          //reapply formatting of DividerHeader
          margin: 0,
          pl: "calc(8px* 1.2)",
          pr: "calc(8px* 1.2)",
          fontFamily: '"Roboto","Helvetica","Arial",sans-serif',
          fontWeight: "400",
          lineHeight: "1.43",
          letterSpacing: "0.01071em",
          color: color,
        }}
      >
        {headerText}
      </Typography>
      <Box
        sx={{
          height: 0,
          flexGrow: 1,
        }}
      />
    </Box>
  );
};
