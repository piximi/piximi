import { useSelector } from "react-redux";
import { Box } from "@mui/material";

import { selectTablesMeasurementTableData } from "store/measurements/reselectors";
import { MeasurementTableContainer } from "./measurement-tables/MeasurementTableContainer";
import { useBreakpointObserver } from "hooks";
import { GroupedMeasurementDisplayTable } from "store/measurements/types";
import { DashboardGrid } from "./DashboardGrid";

export const MeasurementsDashboard = () => {
  const measurementTables = useSelector(selectTablesMeasurementTableData);
  const breakpoint = useBreakpointObserver();
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
        height: "calc(100vh - 64px - 49px)",
        p: 4,
        overflowY: "scroll",
      })}
    >
      <DashboardGrid
        numColumns={["md", "sm", "xs"].includes(breakpoint) ? 1 : 2}
      >
        {generateNodes(measurementTables)}
      </DashboardGrid>
    </Box>
  );
};
