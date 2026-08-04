import { useEffect, useRef, useState } from "react";

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
import type { GridApiCommunity } from "@mui/x-data-grid/internals";
import FileDownloadIcon from "@mui/icons-material/FileDownload";

import { useTableExport } from "@MeasurementViewer/hooks";
import { selectActiveMeasurementGroup } from "@MeasurementViewer/state/selectors";

const CustomMenuItem = styled(MenuItem)(() => ({
  minHeight: "1rem",
  py: 0,
}));

export function ExportButton({
  view,
  gridApiRef,
}: {
  view: "table" | "plots";
  gridApiRef: React.MutableRefObject<GridApiCommunity | null>;
}) {
  const [exportMenuOpen, setExportMenuOpen] = useState(false);
  const exportMenuTriggerRef = useRef<HTMLButtonElement>(null);
  const activeMeasurementGroup = useSelector(selectActiveMeasurementGroup);
  useEffect(() => {
    setExportMenuOpen(false);
  }, [view]);
  const handleExportTable = useTableExport();
  return (
    <Box>
      <Tooltip title={view === "table" ? "Download as CSV" : "Save as PNG"}>
        <IconButton
          ref={exportMenuTriggerRef}
          size="small"
          onClick={() => setExportMenuOpen(true)}
        >
          <FileDownloadIcon fontSize="small" />
        </IconButton>
      </Tooltip>
      {view === "table" ? (
        <Menu
          anchorEl={exportMenuTriggerRef.current}
          open={exportMenuOpen}
          onClose={() => setExportMenuOpen(false)}
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
          anchorEl={exportMenuTriggerRef.current}
          open={exportMenuOpen}
          onClose={() => setExportMenuOpen(false)}
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
