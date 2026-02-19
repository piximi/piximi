import { Box, Button, Stack, Typography } from "@mui/material";
import { DividerHeader } from "components/ui";
import { SettingsItem } from "./SettingsItem";
import { CustomSwitch } from "components/inputs";
import { TensorStorageService } from "services";
import { useDispatch, useSelector } from "react-redux";
import { applicationSettingsSlice } from "store/applicationSettings";
import { selectPersistData } from "store/applicationSettings/selectors";

export const DataSettings = () => {
  const dispatch = useDispatch();
  const persistData = useSelector(selectPersistData);

  const handleTogglePersistData = () => {
    dispatch(applicationSettingsSlice.actions.setPersistData(!persistData));
  };

  const handleClearIndexedDB = async () => {
    try {
      const storage = TensorStorageService.getInstance();
      await storage.clearAll();
    } catch (err) {
      console.error(String(err));
    }
  };
  return (
    <Box>
      <DividerHeader
        typographyVariant="body1"
        textAlign="left"
        sx={(theme) => ({ color: theme.palette.grey[500] })}
      >
        Data
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
              <Typography>
                {"Persist Piximi data in browser storage across sessions"}
              </Typography>
            </Box>
          }
        >
          <CustomSwitch
            checked={persistData}
            onChange={handleTogglePersistData}
            height={24}
            width={42}
          />
        </SettingsItem>
        <SettingsItem
          title={
            <Box display="flex">
              <Typography>
                {"Delete Piximi data from browser storage"}
              </Typography>
            </Box>
          }
        >
          <Button
            sx={(theme) => ({
              height: 24,
              width: 42,
              p: 0,
              color: theme.palette.error.main,
            })}
            onClick={handleClearIndexedDB}
            size="small"
          >
            Delete
          </Button>
        </SettingsItem>
      </Stack>
    </Box>
  );
};
