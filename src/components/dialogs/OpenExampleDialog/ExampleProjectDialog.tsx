import {
  Box,
  Dialog,
  DialogContent,
  DialogTitle,
  IconButton,
  Stack,
  Tab,
  Tabs,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import { ExampleProjectCard } from "./ExampleProjectCard";

import { useTranslation } from "hooks";
import { exampleProjects } from "./exampleProjects";
import { useState } from "react";

type ExampleProjectDialogProps = {
  open: boolean;
  onClose: (event?: object, reason?: "backdropClick" | "escapeKeyDown") => void;
};

export const ExampleProjectDialog = (props: ExampleProjectDialogProps) => {
  const { open, onClose } = props;
  const t = useTranslation();
  const [tabValue, setTabValue] = useState(0);

  const handleChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  return (
    <Dialog
      fullWidth
      maxWidth="md"
      open={open}
      onClose={onClose}
      slotProps={{
        paper: {
          sx: {
            maxHeight: "90vh",
            display: "flex",
            flexDirection: "column",
          },
        },
      }}
    >
      <DialogTitle
        sx={{
          borderBottom: (theme) => `1px solid ${theme.palette.divider}`,
          margin: 0,
          padding: (theme) => theme.spacing(2),
        }}
      >
        {t("Open Example Project")}
        <IconButton
          aria-label="Close"
          sx={(theme) => ({
            color: theme.palette.grey[500],
            position: "absolute",
            right: theme.spacing(1),
            top: theme.spacing(1),
          })}
          onClick={(event) => onClose(event, "escapeKeyDown")}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      <DialogContent
        sx={{
          display: "flex",
          flexDirection: "column",
          flexGrow: 1,
          overflow: "hidden", // prevent double scroll
          borderTop: (theme) => `1px solid ${theme.palette.divider}`,
          margin: 0,
          padding: 1,
        }}
      >
        <Box sx={{ borderBottom: 1, borderColor: "divider" }}>
          <Tabs value={tabValue} onChange={handleChange} variant="fullWidth">
            <Tab label="Image Sets" />
            <Tab label="Image and Object Sets" />
          </Tabs>
        </Box>
        <ExampleProjectTabPanel value={tabValue} index={0}>
          <Stack>
            {exampleProjects.imageSets.map((exampleProject, index) => {
              return (
                <ExampleProjectCard
                  key={`${exampleProject.name}-${index}`}
                  exampleProject={exampleProject}
                  onClose={onClose}
                />
              );
            })}
          </Stack>
        </ExampleProjectTabPanel>
        <ExampleProjectTabPanel value={tabValue} index={1}>
          <Stack>
            {exampleProjects.imagesAndObjectSets.map((exampleImage, index) => {
              return (
                <ExampleProjectCard
                  key={`${exampleImage.name}-${index}`}
                  exampleProject={exampleImage}
                  onClose={onClose}
                />
              );
            })}
          </Stack>
        </ExampleProjectTabPanel>
      </DialogContent>
    </Dialog>
  );
};

interface ExampleProjectTabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}
function ExampleProjectTabPanel(props: ExampleProjectTabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`example-tabpanel-${index}`}
      {...other}
      style={{ height: "calc(100% - 49px)", overflowY: "scroll" }}
    >
      {value === index && (
        <Box
          sx={{
            maxHeight: "calc(100% - 49px)",
            flexGrow: 1,
            overflowY: "scroll",
          }}
        >
          {children}
        </Box>
      )}
    </div>
  );
}
