import { useSelector } from "react-redux";
import { Box } from "@mui/material";
import Masonry from "@mui/lab/Masonry";

import { selectTablesMeasurementTableData } from "store/measurements/reselectors";
import { MeasurementTableContainer } from "./measurement-tables/MeasurementTableContainer";

export const MeasurementsDashboard = () => {
  const measurementTables = useSelector(selectTablesMeasurementTableData);

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
      <Masonry columns={2} spacing={0} sx={{ mx: "auto", width: "90%" }}>
        {measurementTables.map((table) => {
          return (
            <MeasurementTableContainer
              key={`measurement-table-${table.id}`}
              table={table}
            />
          );
        })}
      </Masonry>
    </Box>
  );
};
