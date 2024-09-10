import {
  ListSubheader,
  ListSubheaderProps,
  MenuItem,
  MenuItemProps,
  Select,
  SelectChangeEvent,
} from "@mui/material";
import { ReactNode } from "react";

export function GroupedSelectListSubheader(props: ListSubheaderProps) {
  return (
    <ListSubheader
      sx={(theme) => ({
        backgroundColor: "inherit",
        color: theme.palette.text.disabled,
        lineHeight: "inherit",
        py: 0.5,
      })}
      {...props}
    />
  );
}
export const GroupedSelectMenuItem = (props: MenuItemProps) => {
  return (
    <MenuItem
      dense
      sx={(theme) => ({
        lineHeight: "inherit",
        color: theme.palette.text.primary,
        minHeight: "inherit",
        pl: 4,
      })}
      {...props}
    />
  );
};

GroupedSelectListSubheader.muiSkipListHighlight = true;

export const GroupedSelect = <T,>({
  children,
  value,
  setValue,
}: {
  children: ReactNode;
  value: T;
  setValue: (event: SelectChangeEvent<T>) => void;
}) => {
  return (
    <Select value={value} size="small" variant="standard" onChange={setValue}>
      {children}
    </Select>
  );
};
