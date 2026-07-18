import { CSSProperties } from "react";
import { Box, Typography, TypographyProps } from "@mui/material";

export const PartialDivider = ({
  headerText,
  indentPct,
  containerStyle,
  typographyVariant,
  textTransform,
}: {
  headerText?: string;
  indentPct?: number;
  containerStyle?: CSSProperties;
  typographyVariant?: TypographyProps["variant"];
  textTransform?: TypographyProps["textTransform"];
}) => {
  return (
    <Box
      sx={{ display: "flex", alignItems: "center", my: 1, ...containerStyle }}
    >
      <Box
        sx={(theme) => ({
          height: 0,
          borderBottom: `thin solid ${theme.palette.divider}`,
          width: indentPct ? `${indentPct}%` : "7%",
        })}
      />
      {headerText && (
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
          }}
        >
          {headerText}
        </Typography>
      )}
    </Box>
  );
};
