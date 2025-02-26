import { Tab, TabProps, Tooltip, TooltipProps } from "@mui/material";

type ModifiedTabProps = Omit<TabProps, "disabled">;
type BaseTooltipTabProps = ModifiedTabProps & {
  placement: TooltipProps["placement"];
};
type DisabledTooltipTabProps =
  | {
      disabled: boolean;
      disabledMessage: string;
    }
  | { disabled?: never; disabledMessage?: never };

type TooltipTabProps = BaseTooltipTabProps & DisabledTooltipTabProps;
export const ToolTipTab = (props: TooltipTabProps) => {
  const {
    label,
    onChange,
    value,
    placement,
    disabled,
    disabledMessage,
    ...rest
  } = props;
  return (
    <Tab
      style={{ pointerEvents: "auto" }}
      value={value}
      label={
        <Tooltip
          title={disabled ? disabledMessage : ""}
          arrow
          placement={placement}
        >
          <span>{label}</span>
        </Tooltip>
      }
      disabled={disabled}
      onChange={onChange}
      {...rest}
    />
  );
};
