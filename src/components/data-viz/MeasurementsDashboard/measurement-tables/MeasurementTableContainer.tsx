import { Box, Paper, Toolbar, Typography } from "@mui/material";
import React from "react";
import { GroupedMeasurementDisplayTable } from "store/measurements/types";
import { capitalize } from "utils/common/helpers";
import { MeasurementTable } from "./MeasurementTable";

export const MeasurementTableContainer = ({
  table,
}: {
  table: GroupedMeasurementDisplayTable;
}) => {
  return (
    <Box p={2}>
      <Paper
        sx={(theme) => ({
          minWidth: "100%",
          maxWidth: "100%",
          overflow: "hidden",
          p: 2,
          pt: 0,
          backgroundImage:
            "linear-gradient(rgba(255, 255, 255, .1), rgba(255, 255, 255, .1))",
          border: `1px solid ${theme.palette.text.primary}`,
          borderRadius: theme.shape.borderRadius,
        })}
      >
        <Toolbar>
          <Typography
            sx={{ flex: "1 1 100%" }}
            textAlign="center"
            variant="h6"
            id="tableTitle"
            component="div"
          >
            {capitalize(table.title)}
          </Typography>
        </Toolbar>
        {Object.keys(table.measurements).length === 0 ? (
          <Typography textAlign="center">No Measurements Selected</Typography>
        ) : (
          <MeasurementTable
            tableId={table.id}
            tableMeasurements={table.measurements}
          />
        )}
      </Paper>
    </Box>
  );
};
