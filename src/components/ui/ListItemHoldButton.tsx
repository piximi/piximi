import React, { ReactElement, useEffect, useState } from "react";

import {
  alpha,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  ListItemTextProps,
  TypographyProps,
} from "@mui/material";

export const ListItemHoldButton = ({
  onHoldComplete,
  holdDuration,
  primaryText,
  icon,
  primaryTypographyProps,
}: {
  onHoldComplete: () => void;
  holdDuration: number;
  primaryText: string | ReactElement;
  icon?: ReactElement;
  primaryTypographyProps?: TypographyProps;
} & Pick<ListItemTextProps, "primaryTypographyProps">) => {
  const [holdElapsed, setHoldElapsed] = useState<number>(0);
  const [intervalId, setIntervalId] = useState<NodeJS.Timeout>();
  const [loadPercent, setLoadPercent] = useState<number>(0);

  const handleMouseDown = () => {
    const intervalId = setInterval(() => {
      setHoldElapsed((t) => t + 1);
    }, 10);
    setIntervalId(intervalId);
  };

  const handleMouseUp = () => {
    if (intervalId) clearInterval(intervalId);

    setHoldElapsed(0);
  };

  useEffect(() => {
    setLoadPercent((holdElapsed / holdDuration) * 100);

    if (holdElapsed >= holdDuration) {
      clearInterval(intervalId);
      setHoldElapsed(0);
      onHoldComplete();
    }
  }, [holdElapsed, intervalId, holdDuration, onHoldComplete]);

  return (
    <ListItem disablePadding>
      <ListItemButton
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onTouchStart={handleMouseDown}
        onTouchEnd={handleMouseUp}
        sx={(theme) => ({
          backgroundImage:
            loadPercent > 0
              ? `linear-gradient(to right, ${alpha(
                  theme.palette.primary.main,
                  0.3,
                )} ${loadPercent}%, rgba(255,255,255,0) 1%)`
              : "inherit",
        })}
      >
        {icon && <ListItemIcon>{icon}</ListItemIcon>}

        <ListItemText
          primary={primaryText}
          slotProps={{ primary: primaryTypographyProps }}
        />
      </ListItemButton>
    </ListItem>
  );
};
