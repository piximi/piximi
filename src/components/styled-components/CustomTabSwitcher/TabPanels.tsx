import { Box } from "@mui/material";
import { CommonTabPanelProps } from "./props";

export function SlidingTabPanel(props: CommonTabPanelProps) {
  const { children, value, index, childClassName, ...other } = props;

  return (
    <div
      role="tabpanel"
      id={`model-tabpanel-${index}`}
      aria-labelledby={`project-tab-${index}`}
      {...other}
      style={{
        position: "relative",
        left: -1 * value * 100 + "%",
        transition: "all 300ms cubic-bezier(0.4, 0, 0.2, 1) 0ms",
        height: "calc(100% - 49px)",
      }}
    >
      <Box
        display="flex"
        sx={(theme) => ({
          minWidth: "100%",
          maxHeight: "calc(100vh - 60px)",
          height: "100%",
          minHeight: "100%",

          ["& > ." + childClassName]: {
            minWidth: "100%",
            maxWidth: "100%",
            height: "100%",
            minHeight: "100%",
          },
        })}
      >
        {children}
      </Box>
    </div>
  );
}

export function BasicTabPanel(props: CommonTabPanelProps) {
  const { children, value, index, childClassName, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`simple-tabpanel-${index}`}
      aria-labelledby={`simple-tab-${index}`}
      {...other}
      style={{ height: "calc(100% - 49px)" }}
    >
      {value === index && (
        <Box
          display="flex"
          sx={(theme) => ({
            minWidth: "100%",
            maxHeight: "calc(100vh - 60px)",
            height: "100%",
            minHeight: "100%",

            ["& > ." + childClassName]: {
              minWidth: "100%",
              maxWidth: "100%",
              height: "100%",
              minHeight: "100%",
            },
          })}
        >
          {children}
        </Box>
      )}
    </div>
  );
}

export function ControlledTabPanel(
  props: Omit<CommonTabPanelProps, "value" | "index">
) {
  const { children, childClassName, ...other } = props;

  return (
    <div
      role="tabpanel"
      id={`controlled-tabpanel`}
      aria-labelledby={`controlled-tab`}
      {...other}
      style={{ height: "calc(100% - 49px)" }}
    >
      <Box
        display="flex"
        sx={(theme) => ({
          minWidth: "100%",
          maxHeight: "calc(100vh - 60px)",
          height: "100%",
          minHeight: "100%",

          ["& > ." + childClassName]: {
            minWidth: "100%",
            maxWidth: "100%",
            height: "100%",
            minHeight: "100%",
          },
        })}
      >
        {children}
      </Box>
    </div>
  );
}
