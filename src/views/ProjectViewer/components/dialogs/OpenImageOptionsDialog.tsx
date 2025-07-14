import React, { useRef } from "react";
import {
  Button,
  Checkbox,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  FormControlLabel,
  IconButton,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import { useFileUploadContext } from "contexts";

type OpenImageOptionsDialogProps = {
  open: boolean;
  onClose: (
    event?: object,
    reason?: "backdropClick" | "escapeKeyDown" | "completed",
  ) => void;
};

export const OpenImageOptionsDialog = (props: OpenImageOptionsDialogProps) => {
  const [importAsTimeSeries, setImportAsTimeSeries] = React.useState(false);
  const uploadFiles = useFileUploadContext();
  const onOpenImage = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!event.currentTarget.files || !uploadFiles) return;
    const files: FileList = Object.assign([], event.currentTarget.files);
    await uploadFiles(
      files,
      importAsTimeSeries ? { timeSeriesDelimeter: "_" } : undefined,
    );
    props.onClose();
  };
  const inputRef = useRef<HTMLInputElement | null>(null);

  const handleClick = () => {
    inputRef.current?.click();
  };

  return (
    <Dialog
      fullWidth
      maxWidth="md"
      open={props.open}
      onClose={props.onClose}
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
        {"Import Images"}
        <IconButton
          aria-label="Close"
          sx={(theme) => ({
            color: theme.palette.grey[500],
            position: "absolute",
            right: theme.spacing(1),
            top: theme.spacing(1),
          })}
          onClick={(event) => props.onClose(event, "escapeKeyDown")}
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
        <FormControl size="small">
          <FormControlLabel
            sx={(theme) => ({
              fontSize: theme.typography.body2.fontSize,
              width: "max-content",
              ml: 0,
            })}
            control={
              <Checkbox
                checked={importAsTimeSeries}
                onChange={() => setImportAsTimeSeries((prev) => !prev)}
                color="primary"
              />
            }
            label="Import as Time Series"
            labelPlacement="start"
            disableTypography
          />
        </FormControl>
      </DialogContent>
      <DialogActions>
        <input
          ref={inputRef}
          accept="image/*,.dcm"
          hidden
          multiple
          id="open-image"
          onChange={onOpenImage}
          type="file"
        />
        <Button onClick={handleClick}>Choose Images</Button>
      </DialogActions>
    </Dialog>
  );
};
