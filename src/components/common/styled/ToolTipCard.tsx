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
  name,
  letter,
  description,
}: {
  children: React.ReactNode;
  name: string;
  letter: string;
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
      placement="left"
      title={
        <Card sx={{ width: 210 }} variant="outlined">
          <CardActionArea>
            <CardContent>
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
