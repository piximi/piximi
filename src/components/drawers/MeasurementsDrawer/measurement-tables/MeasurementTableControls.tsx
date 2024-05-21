import {
  Box,
  Button,
  Collapse,
  IconButton,
  Tooltip,
  Typography,
  useTheme,
} from "@mui/material";
import { MeasurementTable } from "store/measurements/types";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import { DividerHeader } from "components/styled-components";
import { TableMeasurementTree } from "./MeasurementTree";
import { MeasurementTableSplitTree } from "./MeasurementTableSplitTree";
import { measurementsSlice } from "store/measurements/measurementsSlice";
import { useDispatch } from "react-redux";

export const MeasurementTableOptions = ({
  table,
  expanded,
  handleTableExpand,
}: {
  table: MeasurementTable;
  expanded: boolean;
  handleTableExpand: (tableId: string) => void;
}) => {
  const theme = useTheme();
  const dispatch = useDispatch();
  const handleRemoveTable = (tableId: string) => {
    dispatch(measurementsSlice.actions.removeTable({ tableId }));
  };

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
          <Box
            sx={{
              display: "flex",
              flexDirection: "row",
              justifyContent: "flex-end",
              px: 2,
            }}
          >
            <Button
              size="small"
              variant="text"
              sx={(theme) => ({ color: theme.palette.error.main })}
              onClick={() => handleRemoveTable(table.id)}
            >
              Remove
            </Button>
          </Box>
          <DividerHeader
            typographyVariant="body2"
            sx={{ pb: 1 }}
            textAlign="left"
          >
            Splits
          </DividerHeader>
          <MeasurementTableSplitTree table={table} />
          <DividerHeader
            typographyVariant="body2"
            sx={{ pt: 2, pb: 1 }}
            textAlign="left"
          >
            Measurements
          </DividerHeader>
          <TableMeasurementTree table={table} />
        </div>
      </Collapse>
    </Box>
  );
};
