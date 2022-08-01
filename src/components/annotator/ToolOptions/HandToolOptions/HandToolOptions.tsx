import React from "react";

import Divider from "@mui/material/Divider";
import List from "@mui/material/List";

import { useTranslation } from "hooks/useTranslation";

import { InformationBox } from "../InformationBox";
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
