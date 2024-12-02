import { Box, Typography } from "@mui/material";
import { Logo } from "components/UI_/Logo";

export const LoadingScreen = () => {
  return (
    <Box
      sx={{
        height: "100vh",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
        }}
      >
        <Logo width={250} height={50} />
        <Typography pt={1}>Loading initial state...</Typography>
      </Box>
    </Box>
  );
};
