import { useDispatch, useSelector } from "react-redux";
import { Box, Stack, Typography } from "@mui/material";
import { DividerHeader } from "components/ui";
import { applicationSettingsSlice } from "store/applicationSettings";
import { selectShowSaveProjectDialog } from "store/applicationSettings/selectors";
import { SettingsItem } from "./SettingsItem";
import { CustomSwitch } from "components/inputs";

export const ProjectSettings = () => {
  const dispatch = useDispatch();
  const showSaveProjectDialog = useSelector(selectShowSaveProjectDialog);
  const handleToggleSaveDialog = () => {
    dispatch(
      applicationSettingsSlice.actions.setShowSaveProjectDialog({
        show: !showSaveProjectDialog,
      }),
    );
  };
  return (
    <Box>
      <DividerHeader
        typographyVariant="body1"
        textAlign="left"
        sx={(theme) => ({ color: theme.palette.grey[500] })}
      >
        Project
      </DividerHeader>
      <Stack
        spacing={1}
        sx={{
          px: 2,
          ".MuiGrid-root:first-of-type": { marginLeft: "0px" },
        }}
      >
        <SettingsItem
          title={
            <Box display="flex">
              <Typography>{"Prompt save when starting new project"}</Typography>
            </Box>
          }
        >
          <CustomSwitch
            checked={showSaveProjectDialog}
            onChange={handleToggleSaveDialog}
            height={24}
            width={42}
          />
        </SettingsItem>
      </Stack>
    </Box>
  );
};
