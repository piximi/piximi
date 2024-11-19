import { useSelector } from "react-redux";
import { Box } from "@mui/material";

import { MeasurementTableContainer } from "../MeasurementsTableContainer";
import { DashboardGrid } from "./DashboardGrid";

import { selectGroupMeasurementDisplayData } from "store/measurements/reselectors";
import { GroupedMeasurementDisplayTable } from "store/measurements/types";

export const MeasurementsDashboard = () => {
  const measurementTables = useSelector(selectGroupMeasurementDisplayData);
  const generateNodes = (tables: GroupedMeasurementDisplayTable[]) => {
    return tables.map((table) => (
      <MeasurementTableContainer
        key={`measurement-table-${table.id}`}
        table={table}
      />
    ));
  };

  return (
    <Box
      component="main"
      sx={(theme) => ({
        transition: theme.transitions.create("margin", {
          duration: theme.transitions.duration.enteringScreen,
          easing: theme.transitions.easing.easeOut,
        }),
        height: "100%",
        p: 4,
        overflowY: "scroll",
      })}
    >
      <DashboardGrid numColumns={1}>
        {generateNodes(measurementTables)}
      </DashboardGrid>
    </Box>
  );
};
