// @ts-nocheck
import React, { ReactElement, useState } from "react";
import {
  Card,
  CardActionArea,
  CardContent,
  Tooltip,
  Typography,
} from "@mui/material";

export const TooltipCard = ({
  children,
  description,
}: {
  children: React.ReactNode;
  description: ReactElement;
}) => {
  const [open, setOpen] = useState<boolean>(false);
  const onClose = () => {
    setOpen(false);
  };

  const onOpen = () => {
    setOpen(true);
  };
  return (
    <Tooltip
      // can't use "sx" prop directly to access tooltip
      // see: https://github.com/mui-org/material-ui/issues/28679
      componentsProps={{
        tooltip: {
          sx: { backgroundColor: "transparent", maxWidth: "none" },
        },
      }}
      onClose={onClose}
      onOpen={onOpen}
      open={open}
      disableInteractive
      placement="left"
      title={
        <Card variant="outlined">
          <CardActionArea>
            <CardContent sx={{ p: 0.5 }}>
              <Typography
                variant="body2"
                color="textSecondary"
                component="span"
              >
                {description}
              </Typography>
            </CardContent>
          </CardActionArea>
        </Card>
      }
    >
      {children}
    </Tooltip>
  );
};
