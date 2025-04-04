import { Select, SelectProps, useTheme } from "@mui/material";

export const StyledSelect = (props: SelectProps) => {
  const theme = useTheme();
  return (
    <Select
      {...props}
      SelectDisplayProps={{
        style: {
          fontSize: theme.typography.body2.fontSize,
          paddingBlock: "4px",
        },
      }}
      inputProps={{
        sx: {
          fontSize: theme.typography.body2.fontSize,
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
        fontSize: theme.typography.body2.fontSize,
        minHeight: "1rem",
      })}
    >
      {props.children}
    </Select>
  );
};
