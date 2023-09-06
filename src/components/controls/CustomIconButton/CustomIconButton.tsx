import {
  IconButton,
  IconButtonProps,
  Tooltip,
  TooltipProps,
} from "@mui/material";
import { ElementType, useEffect, useState } from "react";

type IconButtonType = Omit<IconButtonProps, "children">;
type TooltipType = Omit<TooltipProps, "children" | "title">;

export type CustomIconProps = IconButtonType & {
  onClick: () => void;
  Icon: ElementType;
  tooltipText: string;
  iconSize?: "small" | "medium" | "large";
  tooltipProps?: TooltipType;
};

export const CustomIconButton = ({
  onClick: handleClick,
  Icon,
  tooltipText,
  iconSize,
  tooltipProps,
  ...rest
}: CustomIconProps) => {
  const [_tooltipProps] = useState<TooltipType>({
    placement: "bottom" as "bottom",
    disableInteractive: true,
    enterDelay: 0,
    enterNextDelay: 0,
    arrow: true,
    ...tooltipProps,
  });
  useEffect(() => {
    console.log(_tooltipProps);
  }, [_tooltipProps]);
  return (
    <Tooltip
      // can't use "sx" prop directly to access tooltip
      // see: https://github.com/mui-org/material-ui/issues/28679
      componentsProps={{
        tooltip: {
          sx: { backgroundColor: "#565656", fontSize: "0.85rem" },
        },
        arrow: { sx: { color: "#565656" } },
      }}
      title={tooltipText}
      {..._tooltipProps}
    >
      <span /*IconButton must be wrapped in span in order for tooltip to work while buton is disabled*/
      >
        <IconButton onClick={handleClick} {...rest}>
          <Icon fontSize={iconSize ? iconSize : rest.size} />
        </IconButton>
      </span>
    </Tooltip>
  );
};
