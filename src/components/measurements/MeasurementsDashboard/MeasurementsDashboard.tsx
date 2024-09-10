import { useSelector } from "react-redux";
import { Box } from "@mui/material";

import { selectTablesMeasurementTableData } from "store/measurements/reselectors";
import { MeasurementTableContainer } from "../MeasurementsTableContainer/MeasurementTableContainer";
import { GroupedMeasurementDisplayTable } from "store/measurements/types";
import { DashboardGrid } from "./DashboardGrid";

export const MeasurementsDashboard = () => {
  const measurementTables = useSelector(selectTablesMeasurementTableData);
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
