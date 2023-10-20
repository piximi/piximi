import { useState } from "react";

import { DialogContentText, TextField } from "@mui/material";

import { useTranslation } from "hooks";

import { AlertType } from "types";

import { createGitHubIssue } from "utils";
import { DialogWithAction } from "../DialogWithAction";

type SendFeedbackDialogProps = {
  onClose: () => void;
  open: boolean;
};

export const SendFeedbackDialog = ({
  onClose,
  open,
}: SendFeedbackDialogProps) => {
  const t = useTranslation();

  const [issueTitle, setIssueTitle] = useState("");
  const [issueComment, setIssueComment] = useState("");

  const openGitHubIssue = () => {
    createGitHubIssue(issueTitle, issueComment, AlertType.Warning);

    setIssueTitle("");
    setIssueComment("");

    onClose();
  };

  return (
    <DialogWithAction
      isOpen={open}
      onClose={onClose}
      title={t("Send feedback")}
      content={
        <>
          {" "}
          <DialogContentText
            sx={{
              "& a": { color: "deepskyblue" },
            }}
          >
            {t(
              "Use this form to report issues with Piximi via our GitHub page, or visit"
            )}{" "}
            <a
              href="https://forum.image.sc/tag/piximi"
              target="_blank"
              rel="noreferrer"
            >
              forum.image.sc/tag/piximi
            </a>
            .
          </DialogContentText>
          <TextField
            autoFocus
            margin="dense"
            label="Title"
            id="issue-title"
            onChange={(e) => setIssueTitle(e.target.value)}
            multiline
            rows={1}
            fullWidth
          />
          <TextField
            autoFocus
            margin="dense"
            label="Description"
            id="issue-comment"
            onChange={(e) => setIssueComment(e.target.value)}
            multiline
            rows={10}
            fullWidth
          />
        </>
      }
      onConfirm={openGitHubIssue}
      confirmText="Create Github Issue"
    />
  );
};
