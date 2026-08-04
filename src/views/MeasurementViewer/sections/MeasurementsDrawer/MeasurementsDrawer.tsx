import React, { useMemo } from "react";

import { useSelector } from "react-redux";

import { Box, Typography } from "@mui/material";

import { BaseAppDrawer } from "components/layout";

import { useCreateMeasurementTable } from "@MeasurementViewer/hooks";
import { CreateMeasurementGroupDialog } from "@MeasurementViewer/components/dialogs";
import {
  selectActiveGroupId,
  selectMeasurementGroups,
} from "@MeasurementViewer/state/selectors";

import { DIMENSIONS } from "utils/constants";

import { CreateMeasurementGroupButton } from "./CreateMeasurementGroupButton";
import { MeasurementSelection } from "./MeasurementSelection";

export const MeasurementsDrawer = () => {
  const tables = useSelector(selectMeasurementGroups);
  const activeGroup = useSelector(selectActiveGroupId);

  const activeTable = useMemo(() => {
    if (!activeGroup) return;
    return tables[activeGroup];
  }, [tables, activeGroup]);

  const {
    status,
    handleCloseTableDialog,
    handleCreateTable,
    handleOpenTableDialog,
    isTableDialogOpen,
    kindOptions,
  } = useCreateMeasurementTable();
  return (
    <Box sx={{ display: "flex", flexGrow: 1, gridArea: "action-drawer" }}>
      <BaseAppDrawer>
        <Box
          sx={{
            width: "100%",
            height: "100%",
            display: "flex",
            flexDirection: "column",
            alignContent: "center",
            minHeight: 0,
          }}
        >
          <Box
            sx={{
              width: "100%",
              height: DIMENSIONS.tabHeight,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <CreateMeasurementGroupButton
              status={status}
              handleOpenTableDialog={handleOpenTableDialog}
            />
          </Box>
          <Box
            sx={{
              py: 1,
              flex: 1,
              minHeight: 0,
              overflowY: "scroll",
            }}
          >
            {activeTable ? (
              <MeasurementSelection table={activeTable} />
            ) : (
              <Typography
                variant="body2"
                sx={(theme) => ({
                  color: theme.palette.action.disabled,
                  width: "100%",
                  textAlign: "center",
                })}
              >
                Create a Measurement Group
              </Typography>
            )}
          </Box>
        </Box>
        <CreateMeasurementGroupDialog
          open={isTableDialogOpen}
          onClose={handleCloseTableDialog}
          options={kindOptions}
          selectLabel="Kind"
          title="Create Measurement Table"
          onConfirm={handleCreateTable}
        />
      </BaseAppDrawer>
    </Box>
  );
};
