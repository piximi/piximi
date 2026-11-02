import { useEffect, useEffectEvent, useState } from "react";

import {
  alpha,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
} from "@mui/material";

import type { ReactElement } from "react";

import type { ListItemTextSlotsAndSlotProps } from "@mui/material";

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
  primaryTypographyProps?: NonNullable<
    ListItemTextSlotsAndSlotProps["slotProps"]
  >["primary"];
}) => {
  const [holding, setHolding] = useState(false);
  const holdMs = holdDuration * 10;
  const complete = useEffectEvent(() => onHoldComplete());

  useEffect(() => {
    if (!holding) return;
    const timer = setTimeout(() => {
      setHolding(false);
      complete();
    }, holdMs);
    return () => clearTimeout(timer);
  }, [holding, holdMs]);

  return (
    <ListItem disablePadding>
      <ListItemButton
        onPointerDown={() => setHolding(true)}
        onPointerUp={() => setHolding(false)}
        onPointerLeave={() => setHolding(false)}
        onPointerCancel={() => setHolding(false)}
        sx={(theme) => {
          const fill = alpha(theme.palette.primary.main, 0.3);
          return {
            borderRadius: 0,
            backgroundImage: `linear-gradient(${fill}, ${fill})`,
            backgroundRepeat: "no-repeat",
            backgroundSize: holding ? "100% 100%" : "0% 100%",
            transition: holding ? `background-size ${holdMs}ms linear` : "none",
          };
        }}
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
