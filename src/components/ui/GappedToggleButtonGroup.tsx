import { toggleButtonClasses } from "@mui/material/ToggleButton";
import ToggleButtonGroup, {
  toggleButtonGroupClasses,
  ToggleButtonGroupProps,
} from "@mui/material/ToggleButtonGroup";
import { styled } from "@mui/material/styles";

interface GappedToggleButtonGroupProps extends ToggleButtonGroupProps {
  gapped?: boolean;
  gap?: string | number;
}

export const GappedToggleButtonGroup = styled(ToggleButtonGroup, {
  shouldForwardProp: (prop) => prop !== "gap",
})<GappedToggleButtonGroupProps>(({ theme, gap = "2rem" }) => ({
  gap: gap,
  [`& .${toggleButtonGroupClasses.firstButton}, & .${toggleButtonGroupClasses.middleButton}`]:
    {
      borderBottomRightRadius: theme.shape.borderRadius,
      borderBottomLeftRadius: theme.shape.borderRadius,
    },
  [`& .${toggleButtonGroupClasses.lastButton}, & .${toggleButtonGroupClasses.middleButton}`]:
    {
      borderTopRightRadius: theme.shape.borderRadius,
      borderTopLeftRadius: theme.shape.borderRadius,
      borderTop: `1px solid ${theme.palette.divider}`,
    },
  [`& .${toggleButtonGroupClasses.lastButton}.${toggleButtonClasses.disabled}, & .${toggleButtonGroupClasses.middleButton}.${toggleButtonClasses.disabled}`]:
    {
      borderTop: `1px solid ${theme.palette.action.disabledBackground}`,
    },
}));
