import { useState } from "react";
import { useDispatch } from "react-redux";
import {
  Box,
  Button,
  Collapse,
  IconButton,
  Tooltip,
  Typography,
  useTheme,
} from "@mui/material";
import {
  ExpandMore as ExpandMoreIcon,
  ChevronRight as ChevronRightIcon,
} from "@mui/icons-material";

import { useTableExport } from "../../hooks";

import { DividerHeader, DividerWithLoading } from "components/ui";
import { SplitTree } from "./SplitTree";
import { MeasurementsTree } from "./MeasurementTree";

import { measurementsSlice } from "store/measurements";

import { MeasurementGroup } from "store/measurements/types";
import { LoadStatus } from "utils/types";
import { HelpItem } from "components/layout/HelpDrawer/HelpContent";

export const MeasurementGroupOptions = ({
  table,
  expanded,
  handleTableExpand,
}: {
  table: MeasurementGroup;
  expanded: boolean;
  handleTableExpand: (tableId: string) => void;
}) => {
  const theme = useTheme();
  const [status, setStatus] = useState<LoadStatus>({ loading: false });
  const dispatch = useDispatch();
  const handleRemoveTable = (tableId: string) => {
    dispatch(measurementsSlice.actions.removeGroup({ groupId: tableId }));
  };
  const handleExportTable = useTableExport();

  return (
    <Box
      sx={{
        m: 1,
        py: 1,
        backgroundColor: expanded
          ? `${theme.palette.primary.main}1a`
          : undefined,
        borderRadius: theme.shape.borderRadius,
      }}
    >
      <Box
        display="flex"
        justifyContent="space-between"
        alignItems="center"
        borderRadius={theme.shape.borderRadius}
        px={2}
      >
        <Tooltip title={table.name} disableInteractive>
          <Typography
            noWrap
            sx={{
              "&:hover": {
                cursor: "default",
              },
            }}
          >
            {table.name}
          </Typography>
        </Tooltip>
        <IconButton
          onClick={() => handleTableExpand(table.id)}
          size="small"
          disableRipple
          sx={{ padding: 0 }}
        >
          {expanded ? (
            <ExpandMoreIcon fontSize="small" />
          ) : (
            <ChevronRightIcon fontSize="small" />
          )}
        </IconButton>
      </Box>
      <Collapse in={expanded} timeout="auto" unmountOnExit>
        <div>
          <DividerHeader
            typographyVariant="body2"
            sx={{ py: 1 }}
            textAlign="left"
            data-help={HelpItem.MeasurementSplits}
          >
            Splits
          </DividerHeader>
          <SplitTree group={table} measurementStatus={status} />
          <DividerWithLoading
            data-help={HelpItem.MeasurementsTree}
            title="Measurements"
            loadStatus={status}
          />
          <MeasurementsTree
            group={table}
            measurementStatus={status}
            setMeasurementStatus={setStatus}
          />
          <Box
            sx={{
              display: "flex",
              flexDirection: "row",
              justifyContent: "space-between",
              px: 2,
              py: 1,
            }}
          >
            <Button
              size="small"
              variant="text"
              sx={(theme) => ({ color: theme.palette.text.primary })}
              onClick={() => handleExportTable(table)}
            >
              Export
            </Button>
            <Button
              size="small"
              variant="text"
              sx={(theme) => ({ color: theme.palette.error.main })}
              onClick={() => handleRemoveTable(table.id)}
            >
              Remove
            </Button>
          </Box>
        </div>
      </Collapse>
    </Box>
  );
};
