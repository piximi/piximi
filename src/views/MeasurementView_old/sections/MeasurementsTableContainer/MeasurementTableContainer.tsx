import React, { useState } from "react";
import {
  Box,
  Collapse,
  IconButton,
  Paper,
  Toolbar,
  Typography,
} from "@mui/material";
import {
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
} from "@mui/icons-material";

import { CustomTabs } from "components/layout";
import { MeasurementPlotsContainer } from "../MeasurementPlotsContainer";
import { MeasurementTable } from "./MeasurementTable";

import { capitalize } from "utils/stringUtils";

import { GroupedMeasurementDisplayTable } from "store/measurements/types";
import { HelpItem } from "components/layout/HelpDrawer/HelpContent";

export const MeasurementTableContainer = ({
  table,
}: {
  table: GroupedMeasurementDisplayTable;
}) => {
  const [expanded, setExpanded] = useState(true);
  const handleExpand = () => {
    setExpanded((expanded) => !expanded);
  };

  return (
    <Box p={2}>
      <Paper
        sx={(theme) => ({
          minWidth: "100%",
          maxWidth: "100%",
          overflow: "hidden",
          p: 0,
          pt: 0,
          backgroundImage:
            "linear-gradient(rgba(255, 255, 255, .1), rgba(255, 255, 255, .1))",
          border: `1px solid ${theme.palette.divider}`,
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
          <IconButton
            sx={(theme) => ({ position: "absolute", right: theme.spacing(2) })}
            onClick={handleExpand}
          >
            {expanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
          </IconButton>
        </Toolbar>
        <Collapse in={expanded}>
          <Box minHeight={"500px"} height={`400px`}>
            <CustomTabs
              tabHelp={{ tabBar: HelpItem.MeasurementGroupTabs }}
              transition="sliding"
              childClassName="measurement-tabs"
              labels={["Data Grid", "Plots"]}
            >
              {Object.keys(table.measurements).length === 0 ? (
                <Typography textAlign="center">
                  No Measurements Selected
                </Typography>
              ) : (
                <MeasurementTable tableMeasurements={table.measurements} />
              )}

              <MeasurementPlotsContainer measurementGroup={table} />
            </CustomTabs>
          </Box>
        </Collapse>
      </Paper>
    </Box>
  );
};
