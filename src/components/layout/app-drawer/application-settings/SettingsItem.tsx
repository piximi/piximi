import { Box, Typography } from "@mui/material";
import { ReactNode } from "react";

export const SettingsItem = ({
  title,
  children,
}: {
  title: string | ReactNode;
  children: ReactNode;
}) => {
  return (
    <Box
      display="flex"
      flexDirection="row"
      justifyContent="space-between"
      alignItems="flex-end"
      height="40px"
    >
      {typeof title === "string" ? <Typography>{title}</Typography> : title}

      {children}
    </Box>
  );
};
