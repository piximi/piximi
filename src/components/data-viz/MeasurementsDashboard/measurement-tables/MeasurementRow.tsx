import {
  Collapse,
  IconButton,
  TableCell,
  TableRow,
  Typography,
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import { MeasurementDisplayTable } from "store/measurements/types";
import React from "react";
import { SplitTable } from "./SplitTable";

export const MeasurementRow = ({
  tableMeasurement,
  tableData,
}: {
  tableMeasurement: string;
  tableData: MeasurementDisplayTable;
}) => {
  const [expanded, setExpanded] = React.useState(false);
  const handleExpand = () => {
    setExpanded((expanded) => !expanded);
  };

  return (
    <React.Fragment>
      <TableRow sx={{ "& > *": { borderBottom: "unset" } }}>
        <TableCell>
          <IconButton size="small" onClick={handleExpand} disableRipple>
            {expanded ? <ExpandMoreIcon /> : <ChevronRightIcon />}
          </IconButton>
        </TableCell>
        <TableCell component="th" scope="row">
          <Typography>{tableMeasurement}</Typography>
        </TableCell>
      </TableRow>
      <TableRow>
        <TableCell style={{ paddingBottom: 0, paddingTop: 0 }} colSpan={2}>
          <Collapse in={expanded} timeout="auto" unmountOnExit>
            <SplitTable
              title={tableData.title}
              columns={tableData.columns}
              rows={tableData.rows}
            />
          </Collapse>
        </TableCell>
      </TableRow>
    </React.Fragment>
  );
};
