import { Box, Button, Typography } from "@mui/material";
import { Add } from "@mui/icons-material";

export const CreateMeasurementGroupButton = ({
  handleOpenTableDialog,
}: {
  handleOpenTableDialog: () => void;
}) => {
  return (
    <Button
      variant="contained"
      onClick={handleOpenTableDialog}
      size="small"
      sx={{
        width: "70%",
      }}
    >
      <Box
        sx={{
          display: "flex",
          alignItems: "center",

          gap: 2,
        }}
      >
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexGrow: 1,
          }}
        >
          <Add fontSize="small" />
        </Box>

        <Typography variant="body2">Add Table</Typography>
      </Box>
    </Button>
  );
};
