import React, { ElementType } from "react";

import { Box, CircularProgress, Tooltip } from "@mui/material";

import { useTranslation } from "hooks";
import { CustomIconButton } from "../CustomIconButton";

//TODO: No storybook because of useTranslate

type ModelExecButtonProps = {
  disabled?: boolean;
  loading?: boolean;
  helperText?: string;
  buttonLabel: string;
  disabledText?: string;
  onClick: () => void;
  icon: ElementType;
};

export const ModelExecButton = ({
  disabled,
  loading,
  buttonLabel,
  helperText,
  disabledText,
  onClick: handleClick,
  icon,
}: ModelExecButtonProps) => {
  const t = useTranslation();

  return (
    <Box width="33%" display="flex" justifyContent="center" alignItems="center">
      {loading ? (
        <Tooltip
          // can't use "sx" prop directly to access tooltip
          // see: https://github.com/mui-org/material-ui/issues/28679
          componentsProps={{
            tooltip: {
              sx: { backgroundColor: "#565656", fontSize: "0.85rem" },
            },
            arrow: { sx: { color: "#565656" } },
          }}
          title={helperText}
          placement="bottom"
          disableInteractive
          enterDelay={0}
          enterNextDelay={0}
          arrow
        >
          <CircularProgress
            disableShrink
            size={24}
            sx={{ alignSelf: "center" }}
          />
        </Tooltip>
      ) : (
        <CustomIconButton
          onClick={handleClick}
          Icon={icon}
          disabled={disabled}
          tooltipText={disabled && disabledText ? disabledText : t(buttonLabel)}
          size="large"
          iconSize="medium"
        />
      )}
    </Box>
  );
};
