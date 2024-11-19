import { ReactElement, useState } from "react";
import {
  Box,
  Collapse,
  IconButton,
  Paper,
  Table,
  TableBody,
  TableContainer,
  Toolbar,
  Typography,
} from "@mui/material";
import {
  ExpandLess as ExpandLessIcon,
  ExpandMore as ExpandMoreIcon,
} from "@mui/icons-material";

export const DataTable = ({
  title,
  collapsible,
  children,
}: {
  title: string;
  collapsible?: boolean;
  children: ReactElement;
}) => {
  const [isCollapsed, setIsCollapsed] = useState<boolean>(true);

  const handleCollapse = () => {
    setIsCollapsed((collapsed) => !collapsed);
  };
  return (
    <Box maxWidth="100%">
      <Toolbar
        sx={(theme) => ({
          backgroundColor: theme.palette.background.default,
          borderBottom: "1px solid rgba(23, 23, 23, 1)",
          borderRadius: "4px 4px 0 0",
          pl: { sm: 2 },
          pr: { xs: 1, sm: 1 },
        })}
        variant="dense"
      >
        <Typography
          sx={{ flex: "1 1 100%" }}
          variant="body1"
          id="tableTitle"
          component="div"
          noWrap
        >
          {title}
        </Typography>
        {collapsible && (
          <IconButton onClick={() => handleCollapse()}>
            {isCollapsed ? <ExpandMoreIcon /> : <ExpandLessIcon />}
          </IconButton>
        )}
      </Toolbar>
      <Collapse in={!collapsible ? true : !isCollapsed}>
        <TableContainer sx={{ borderRadius: "0 0 4px 4px" }} component={Paper}>
          <Table>
            <TableBody>{children}</TableBody>
          </Table>
        </TableContainer>
      </Collapse>
    </Box>
  );
};
