import {
  Box,
  Button,
  CircularProgress,
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
import { useDispatch, useSelector } from "react-redux";
import { selectMeasurementData } from "store/measurements/selectors";
import {
  selectCategoriesDictionary,
  selectThingsDictionary,
} from "store/data/selectors";
import { saveAs } from "file-saver";
import { useState } from "react";

export const MeasurementTableOptions = ({
  table,
  expanded,
  handleTableExpand,
}: {
  table: MeasurementTable;
  expanded: boolean;
  handleTableExpand: (tableId: string) => void;
}) => {
  const measurementData = useSelector(selectMeasurementData);
  const thingDetails = useSelector(selectThingsDictionary);
  const categories = useSelector(selectCategoriesDictionary);
  const theme = useTheme();
  const [loading, setLoading] = useState(false);
  const dispatch = useDispatch();
  const handleRemoveTable = (tableId: string) => {
    dispatch(measurementsSlice.actions.removeTable({ tableId }));
  };
  const handleExportTable = () => {
    const thingIds = table.thingIds;
    const exportData: Record<string, number | string>[] = [];
    thingIds.forEach((thingId) => {
      const thing = thingDetails[thingId];
      const data: Record<string, number | string> = { id: thingId };
      data.name = thing.name;
      data.kind = thing.kind;
      if ("imageId" in thing) {
        data.imageName = thingDetails[thing.imageId].name;
        data["bbox [x1:y1:x2:y2]"] = `[${thing.boundingBox.join(":")}]`;
      }
      data.category = categories[thing.categoryId].name;
      data.partition = thing.partition;
      Object.assign(data, measurementData[thingId].measurements);
      exportData.push(data);
    });
    const refined: string[] = [];
    refined.push(Object.keys(exportData[0]).join(","));
    exportData.forEach((row) => {
      refined.push(Object.values(row).join(","));
    });
    const csvContent = refined.join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8," });
    const objUrl = URL.createObjectURL(blob);
    saveAs(objUrl, `${table.kind}-measurements.csv`);
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
          <DividerHeader
            typographyVariant="body2"
            sx={{ py: 1 }}
            textAlign="left"
          >
            Splits
          </DividerHeader>
          <MeasurementTableSplitTree
            table={table}
            loading={loading}
            setLoading={setLoading}
          />
          <Box display="flex" alignItems="center" my={1}>
            <Box
              sx={(theme) => ({
                height: 0,
                borderBottom: `thin solid ${theme.palette.divider}`,
                width: "7%",
              })}
            />
            <Typography
              sx={{
                //reapply formatting of DividerHeader
                margin: 0,
                pl: "calc(8px* 1.2)",
                pr: "calc(8px* 1.2)",
                fontFamily: '"Roboto","Helvetica","Arial",sans-serif',
                fontWeight: "400",
                fontSize: "0.875rem",
                lineHeight: "1.43",
                letterSpacing: "0.01071em",
                textTransform: "uppercase",
              }}
            >
              Measurements
            </Typography>
            <Box
              sx={(theme) => ({
                height: 0,
                borderBottom: `thin solid ${theme.palette.divider}`,
                flexGrow: 1,
              })}
            />
            {loading && (
              <Box
                sx={{
                  p: 0,
                  pl: "calc(8px* 1.2)",
                  pr: "calc(8px* 1.2)",
                  display: "flex",
                  alignItems: "center",
                }}
              >
                <CircularProgress size="1.25rem" />
              </Box>
            )}
            <Box
              sx={(theme) => ({
                height: 0,
                borderBottom: `thin solid ${theme.palette.divider}`,
                width: "5%",
              })}
            />
          </Box>
          <TableMeasurementTree
            table={table}
            loading={loading}
            setLoading={setLoading}
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
              onClick={() => handleExportTable()}
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
