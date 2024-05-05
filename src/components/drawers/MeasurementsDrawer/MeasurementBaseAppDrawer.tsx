import { Box, Divider, Drawer } from "@mui/material";
import { ApplicationOptionsList } from "components/lists";

export const MeasurementBaseAppDrawer = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  return (
    <Drawer
      anchor="left"
      sx={{
        display: "flex",
        flexDirection: "column",
        flexShrink: 0,
        width: (theme) => theme.spacing(32),
        overflow: "hidden",
        "& > 	.MuiDrawer-paper": {
          zIndex: 99,
          width: (theme) => theme.spacing(32),
          height: "100vh",
          overflow: "hidden",
          backgroundColor: "transparent",
          backgroundImage: "none",
          borderRight: "none",
        },
      }}
      open
      variant="persistent"
    >
      <Box sx={{ overflowY: "scroll", overflowX: "hidden", flexGrow: 1 }}>
        {children}
      </Box>
      <Divider />
      <ApplicationOptionsList />
    </Drawer>
  );
};
