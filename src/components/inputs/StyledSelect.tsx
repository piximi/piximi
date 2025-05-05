import { Select, SelectProps, useTheme } from "@mui/material";
import { CSSProperties } from "react";

export type StyledSelectProps = SelectProps &
  Partial<Pick<CSSProperties, "fontSize">>;
export const StyledSelect = (props: StyledSelectProps) => {
  const theme = useTheme();
  return (
    <Select
      {...props}
      SelectDisplayProps={{
        style: {
          fontSize: props.fontSize ?? theme.typography.body2.fontSize,
          paddingBlock: "4px",
        },
      }}
      inputProps={{
        sx: {
          fontSize: props.fontSize ?? theme.typography.body2.fontSize,
        },
      }}
      MenuProps={{
        sx: {
          py: 0,
          "& .MuiList-root-MuiMenu-list": { py: 0 },
          "& li": {
            minHeight: "1rem",
            borderRadius: 0,
          },
          "& ul": {
            py: 0,
          },
        },
        slotProps: {
          list: {
            dense: true,
            sx: {
              py: 0,
              backgroundColor: "red",
              display: "none",
            },
          },
          paper: {
            sx: {
              borderRadius: "0 0 4px 4px",
            },
          },
        },
      }}
      sx={(theme) => ({
        fontSize: props.fontSize ?? theme.typography.body2.fontSize,
        minHeight: "1rem",
      })}
    >
      {props.children}
    </Select>
  );
};
