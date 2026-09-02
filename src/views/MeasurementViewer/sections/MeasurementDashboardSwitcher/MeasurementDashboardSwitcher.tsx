import { useCallback, useMemo } from "react";

import { useDispatch, useSelector } from "react-redux";

import { Box } from "@mui/material";

import { CustomTabs } from "@MeasurementViewer/components/custom-tab-switcher";
import { measurementsSlice } from "@MeasurementViewer/state";
import {
  selectActiveGroupId,
  selectMeasurementGroups,
} from "@MeasurementViewer/state/selectors";

import { MeasurementDashboard } from "../MeasurementDashboard";

export const MeasurementDashboardSwitcher = () => {
  const dispatch = useDispatch();
  const measurementGroups = useSelector(selectMeasurementGroups);
  const activeMeesurementGroup = useSelector(selectActiveGroupId);

  const groupIds = useMemo(
    () => Object.keys(measurementGroups),
    [measurementGroups],
  );
  //TODO: change to dict lookup
  const renderTableTitle = useCallback(
    (groupId: string) => {
      return measurementGroups[groupId].name;
    },
    [measurementGroups],
  );

  const handleDeleteGroup = (groupId: string) => {
    dispatch(measurementsSlice.actions.removeGroup(groupId));
  };
  const handleEditGroupName = (groupId: string, newName: string) => {
    dispatch(measurementsSlice.actions.updateGroupName({ groupId, newName }));
  };

  return (
    <Box
      sx={(theme) => ({
        maxHeight: "100vh",
        height: "100%",
        gridArea: "dashboard",
        overflow: "scroll",
        border: `1px solid ${theme.palette.divider}`,
        borderRadius: "4px 4px 0 0",
        backgroundColor: theme.palette.background.default,
      })}
    >
      <CustomTabs
        childClassName="measurement-group"
        labels={groupIds}
        secondaryEffect={(tableId: string) => {
          dispatch(measurementsSlice.actions.setActiveGroup(tableId));
        }}
        activeLabel={activeMeesurementGroup}
        renderLabel={renderTableTitle}
        extendable={true}
        editable={true}
        handleTabEdit={handleEditGroupName}
        handleTabClose={handleDeleteGroup}
      >
        {groupIds.map((id) => (
          <MeasurementDashboard key={`measurement-table-${id}`} />
        ))}
      </CustomTabs>
    </Box>
  );
};
