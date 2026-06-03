import type { ReactNode } from "react";
import { useRef, useState } from "react";

import { Box, Button, Collapse, Typography } from "@mui/material";

import ExpandIcon from "components/ui/ExpandIcon";

const FileInfoContainer = ({
  label,
  expanded,
  setExpanded,
  children,
}: {
  label: string;
  expanded: boolean;
  setExpanded: () => void;
  children: ReactNode;
}) => (
  <Box
    sx={(theme) => ({
      display: "flex",
      flexDirection: "column",
      borderRadius: 1,
      transition: theme.transitions.create("all"),
      border: `1px solid ${theme.palette.text.primary}`,
    })}
  >
    <Box
      sx={(theme) => ({
        display: "flex",
        justifyContent: "space-between",
        px: 1,
        py: 0.5,
        borderRadius: 1,
        transition: theme.transitions.create("all"),
        bgcolor: expanded ? theme.palette.action.hover : "none",
        ":hover": {
          transition: theme.transitions.create("all"),
          bgcolor: expanded ? "none" : theme.palette.action.hover,
          cursor: "pointer",
        },
      })}
      onClick={setExpanded}
    >
      <Typography fontSize="small">{label}</Typography>
      <ExpandIcon expanded={expanded} sx={{ fontSize: "1.25rem" }} />
    </Box>
    <Collapse in={expanded}>
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: "max-content 1fr",
          gap: 2,
          alignItems: "flex-start",
          py: 1,
          px: 2,
          "& p": {
            fontSize: "small",
          },
        }}
      >
        {children}
      </Box>
    </Collapse>
  </Box>
);

const RequiredFileInfo = () => (
  <>
    <Typography sx={{ fontWeight: "bold" }}>Model Topology</Typography>
    <Typography>
      A <code>.json</code> file describing the {`model's`} architecture. This
      defines the structure of the network and is needed to reconstruct the
      model.
    </Typography>
    <Typography sx={{ fontWeight: "bold" }}>Model Weights</Typography>
    <Typography>
      A <code>.bin</code> file containing the values learned during training.
      Without this, the model has no knowledge from previous training runs.
    </Typography>
  </>
);
const OptionalFileInfo = () => (
  <>
    <Typography sx={{ fontWeight: "bold" }}>Model Manifest</Typography>
    <Typography>
      A <code>piximi_manifest.json</code> file generated automatically when
      saving a model from Piximi. When present, Piximi uses it to reliably
      locate and identify all associated files. If absent, Piximi will attempt
      to detect files automatically.
    </Typography>
    <Typography sx={{ fontWeight: "bold" }}>Model Runs</Typography>
    <Typography>
      A <code>.json</code> file containing records of previous training runs,
      including metrics and hyperparameters. Including this restores the
      training history visible in the Run Summary panel..
    </Typography>
  </>
);

export const LocalClassifierUpload = ({
  onUploadModel,
}: {
  onUploadModel: (event: React.ChangeEvent<HTMLInputElement>) => Promise<void>;
}) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [requiredOpen, setRequiredOpen] = useState(false);
  const [optionalOpen, setOptionalOpen] = useState(false);
  return (
    <>
      <Typography sx={{ mb: 1, fontSize: "small" }}>
        Select the files with the model you want to upload. You can select the
        files individually or bundled in a <code>.zip</code>.
      </Typography>
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          gap: 1,
          px: 2,
          overflowY: "scroll",
        }}
      >
        <FileInfoContainer
          label="Required Files"
          expanded={requiredOpen}
          setExpanded={() => setRequiredOpen((v) => !v)}
        >
          <RequiredFileInfo />
        </FileInfoContainer>
        <FileInfoContainer
          label="Optional Files"
          expanded={optionalOpen}
          setExpanded={() => setOptionalOpen((v) => !v)}
        >
          <OptionalFileInfo />
        </FileInfoContainer>
      </Box>

      <input
        accept=".zip,.json,.bin"
        multiple
        ref={inputRef}
        hidden
        type="file"
        id="open-model-file"
        onChange={(event: React.ChangeEvent<HTMLInputElement>) =>
          onUploadModel(event)
        }
      />
      <Box sx={{ display: "flex", justifyContent: "flex-end", py: 1 }}>
        <Button variant="text" onClick={() => inputRef.current!.click()}>
          Upload Model
        </Button>
      </Box>
    </>
  );
};
