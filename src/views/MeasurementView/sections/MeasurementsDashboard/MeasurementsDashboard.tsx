import { useCallback, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Box } from "@mui/material";

import { CustomTabs } from "components/layout";
import { MeasurementTableContainer } from "../MeasurementsTableContainer";

import { measurementsSlice } from "../../state/redux/measurementsSlice";
import { selectActiveGroupId } from "../../state/redux/selectors";
import { selectGroupMeasurementDisplayData } from "../../state/redux/reselectors";

export const MeasurementsDashboard = () => {
  const dispatch = useDispatch();
  const measurementTables = useSelector(selectGroupMeasurementDisplayData);
  const activeMeesurementGroup = useSelector(selectActiveGroupId);

  const groupLabels = useMemo(
    () => measurementTables.map((table) => table.id),
    [measurementTables],
  );
  //TODO: change to dict lookup
  const renderTableTitle = useCallback(
    (tableId: string) => {
      const table = measurementTables.find((table) => table.id === tableId);
      return table!.title;
    },
    [measurementTables],
  );

  const handleDeleteGroup = (groupId: string) => {
    dispatch(measurementsSlice.actions.removeGroup(groupId));
  };
  const handleEditGroupName = (groupId: string, newName: string) => {
    console.log(newName);
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
        extendable={true}
        editable={true}
        handleTabEdit={handleEditGroupName}
        childClassName="measurement-group"
        labels={groupLabels}
        handleTabClose={handleDeleteGroup}
        handleNew={() => {}}
        secondaryEffect={(tableId: string) => {
          dispatch(measurementsSlice.actions.setActiveGroup(tableId));
        }}
        activeLabel={activeMeesurementGroup}
        renderLabel={renderTableTitle}
        omitAddIcon={true}
      >
        {measurementTables.map((table) => (
          <MeasurementTableContainer
            key={`measurement-table-${table.id}`}
            table={table}
          />
        ))}
      </CustomTabs>
    </Box>
  );
};
