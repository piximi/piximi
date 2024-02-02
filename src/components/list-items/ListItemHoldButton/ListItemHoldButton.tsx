import React, { ReactElement, useEffect, useState } from "react";

import {
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  ListItemTextProps,
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
} & Pick<ListItemTextProps, "primaryTypographyProps">) => {
  const [holdElapsed, setHoldElapsed] = useState<number>(0);
  const [intervalId, setIntervalId] = useState<NodeJS.Timer>();
  const [loadPercent, setLoadPercent] = useState<number>(0);

  const handleMouseDown = () => {
    const intervalId = setInterval(() => {
      setHoldElapsed((t) => t + 1);
    }, 10);
    setIntervalId(intervalId);
  };

  const handleMouseUp = () => {
    clearInterval(intervalId);

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
    <ListItem
      disablePadding
      sx={{
        backgroundImage: `linear-gradient(to right, rgba(255,255,255,0.3) ${loadPercent}%, rgba(255,255,255,0) 1%)`,
      }}
    >
      <ListItemButton
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onTouchStart={handleMouseDown}
        onTouchEnd={handleMouseUp}
      >
        {icon && <ListItemIcon>{icon}</ListItemIcon>}

        <ListItemText
          primary={primaryText}
          primaryTypographyProps={primaryTypographyProps}
        />
      </ListItemButton>
    </ListItem>
  );
};
