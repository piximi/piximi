import React from "react";
import { InformationBox } from "../InformationBox";
import Divider from "@mui/material/Divider";
import { useTranslation } from "../../../../hooks/useTranslation";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import ListItemText from "@mui/material/ListItemText";
import { useDispatch } from "react-redux";
import { imageViewerSlice } from "../../../../annotator/store/slices";
import { ResetButton } from "./ResetButton";

export const HandToolOptions = () => {
  const t = useTranslation();

  return (
    <>
      <InformationBox description="…" name={t("Hand tool")} />

      <Divider />

      <List dense>
        <ResetButton />
      </List>
    </>
  );
};
