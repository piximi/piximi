import { ReactNode } from "react";
import { Box, CircularProgress, Typography } from "@mui/material";

import { LoadStatus } from "utils/types";

export const DividerWithLoading = ({
  title,
  loadStatus,
  loadedStateIcon,
}: {
  title: string;
  loadStatus: LoadStatus;
  loadedStateIcon?: ReactNode;
}) => {
  return (
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
          textTransform: "capitalize",
        }}
      >
        {title}
      </Typography>
      <Box
        sx={(theme) => ({
          height: 0,
          borderBottom: `thin solid ${theme.palette.divider}`,
          flexGrow: 1,
        })}
      />
      {loadStatus.loading ? (
        <Box
          sx={{
            p: 0,
            pl: "calc(8px* 1.2)",
            pr: "calc(8px* 1.2)",
            display: "flex",
            alignItems: "center",
          }}
        >
          <CircularProgress
            size="1.25rem"
            variant={loadStatus.value ? "determinate" : "indeterminate"}
            value={loadStatus.value}
            sx={
              loadStatus.value
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
        <>{loadedStateIcon}</>
      )}
      <Box
        sx={(theme) => ({
          height: 0,
          borderBottom: `thin solid ${theme.palette.divider}`,
          width: "5%",
        })}
      />
    </Box>
  );
};
