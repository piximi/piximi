import { Box, Button, CircularProgress, Typography } from "@mui/material";
import { Add } from "@mui/icons-material";

import type { LoadStatus } from "utils/types";

export const CreateMeasurementGroupButton = ({
  status,
  handleOpenTableDialog,
}: {
  status: LoadStatus;
  handleOpenTableDialog: () => void;
}) => {
  return (
    <Button
      variant="contained"
      disabled={status.loading}
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
          {status.loading ? (
            <Box
              sx={{
                p: 0,
                px: 1,
                display: "flex",
                alignItems: "center",
              }}
            >
              <CircularProgress
                size="1rem"
                variant={status.value ? "determinate" : "indeterminate"}
                value={status.value}
                sx={
                  status.value
                    ? {
                        transition:
                          "transform 10ms cubic-bezier(0.4, 0, 0.2, 1) 0ms",
                        "& .MuiCircularProgress-circle": {
                          transition:
                            "transform 10ms cubic-bezier(0.4, 0, 0.2, 1) 0ms",
                        },
                      }
                    : {}
                }
              />
            </Box>
          ) : (
            <Add fontSize="small" />
          )}
        </Box>

        <Typography variant="body2">Add Table</Typography>
      </Box>
    </Button>
  );
};
