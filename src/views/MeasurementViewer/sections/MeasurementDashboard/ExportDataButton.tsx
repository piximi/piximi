import { useState } from "react";

import { useSelector } from "react-redux";

import {
  Box,
  IconButton,
  ListItemText,
  Menu,
  MenuItem,
  styled,
  Tooltip,
} from "@mui/material";
import FileDownloadIcon from "@mui/icons-material/FileDownload";

import { useTableExport } from "@MeasurementViewer/hooks";
import { selectActiveMeasurementGroup } from "@MeasurementViewer/state/selectors";

import type { RefObject } from "react";

import type { GridApiCommunity } from "@mui/x-data-grid/internals";

const CustomMenuItem = styled(MenuItem)(() => ({
  minHeight: "1rem",
  py: 0,
}));

export function ExportButton({
  view,
  gridApiRef,
}: {
  view: "table" | "plots";
  gridApiRef: RefObject<GridApiCommunity | null>;
}) {
  const activeMeasurementGroup = useSelector(selectActiveMeasurementGroup);
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
  const handleClose = () => setAnchorEl(null);
  const handleExportTable = useTableExport();
  return (
    <Box>
      <Tooltip title={view === "table" ? "Download as CSV" : "Save as PNG"}>
        <IconButton
          data-doc="export-data"
          size="small"
          onClick={(e) => setAnchorEl(e.currentTarget)}
        >
          <FileDownloadIcon fontSize="small" />
        </IconButton>
      </Tooltip>
      {view === "table" ? (
        <Menu
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={handleClose}
          anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
          transformOrigin={{ vertical: "top", horizontal: "right" }}
          slotProps={{
            list: {
              "aria-labelledby": "settings-menu-trigger",
              dense: true,
            },
          }}
        >
          <CustomMenuItem
            onClick={() => {
              if (gridApiRef.current && activeMeasurementGroup)
                gridApiRef.current.exportDataAsCsv({
                  fileName:
                    activeMeasurementGroup.name.replace(" ", "-") +
                    "-statistics",
                });
            }}
          >
            <ListItemText>Statistics</ListItemText>
          </CustomMenuItem>
          <CustomMenuItem onClick={() => handleExportTable()}>
            <ListItemText>Individual</ListItemText>
          </CustomMenuItem>
          <CustomMenuItem
            onClick={() => {
              if (gridApiRef.current && activeMeasurementGroup)
                gridApiRef.current.exportDataAsCsv({
                  fileName:
                    activeMeasurementGroup.name.replace(" ", "-") +
                    "-statistics",
                });
              handleExportTable();
            }}
          >
            <ListItemText>Statistics & Individual</ListItemText>
          </CustomMenuItem>
        </Menu>
      ) : (
        <Menu
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={handleClose}
          anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
          transformOrigin={{ vertical: "top", horizontal: "right" }}
          slotProps={{
            list: {
              "aria-labelledby": "settings-menu-trigger",
              dense: true,
            },
          }}
        >
          <CustomMenuItem onClick={() => {}}>
            <ListItemText>Current Plot</ListItemText>
          </CustomMenuItem>
          <CustomMenuItem onClick={() => {}}>
            <ListItemText>All Plots</ListItemText>
          </CustomMenuItem>
        </Menu>
      )}
    </Box>
  );
}
