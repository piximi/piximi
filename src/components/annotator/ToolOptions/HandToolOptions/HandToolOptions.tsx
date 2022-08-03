import React from "react";

import { Divider, List } from "@mui/material";

import { useTranslation } from "hooks";

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
