import { Box, Button, Stack, Typography } from "@mui/material";
import { DividerHeader } from "components/ui";
import { SettingsItem } from "./SettingsItem";
import { CustomSwitch } from "components/inputs";
import { TensorStorageService } from "services";
import { useState } from "react";

export const DataSettings = () => {
  const [persistData, setPersistData] = useState(true);

  const handleTogglePersistData = () => {
    setPersistData((value) => !value);
  };

  const handleClearIndexedDB = () => {
    try {
      const storage = TensorStorageService.getInstance();
      storage.clearAll();
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
