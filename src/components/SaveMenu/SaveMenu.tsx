import React from "react";
import { saveAs } from "file-saver";
import { useSelector } from "react-redux";
import {
  classifierSelector,
  createdCategoriesSelector,
} from "../../store/selectors";
import { bindMenu } from "material-ui-popup-state";
import { Divider, Menu, MenuItem, MenuList } from "@mui/material";
import { serializedProjectSelector } from "../../store/selectors/serializedProjectSelector";
import { fittedSelector } from "../../store/selectors/fittedSelector";
import { modelNameSelector } from "../../store/selectors/modelNameSelector";

type SaveMenuProps = {
  popupState: any;
};

export const SaveMenu = ({ popupState }: SaveMenuProps) => {
  const classifier = useSelector(classifierSelector);

  const serializedProject = useSelector(serializedProjectSelector);

  const createdCategories = useSelector(createdCategoriesSelector);

  const fitted = useSelector(fittedSelector);

  const modelName = useSelector(modelNameSelector);

  const onSaveProjectClick = (
    event: React.MouseEvent<HTMLElement, MouseEvent>
  ) => {
    const part = {
      classifier: classifier,
      project: serializedProject,
      version: "0.0.0",
    };

    const parts = [JSON.stringify(part)];

    const data = new Blob(parts, { type: "application/json;charset=utf-8" });

    saveAs(data, `${serializedProject.name}.json`);
  };

  const onSaveClassifierClick = async () => {
    if (fitted) {
      await fitted.save(`downloads://${modelName}`);
    }

    const part = {
      categories: createdCategories,
    };
    const parts = [JSON.stringify(part)];
    const data = new Blob(parts, { type: "application/json;charset=utf-8" });
    saveAs(data, `${modelName}.categories.json`);
  };

  return (
    <Menu {...bindMenu(popupState)}>
      <MenuList dense variant="menu">
        <MenuItem onClick={onSaveProjectClick}>Save project</MenuItem>

        <Divider />

        <MenuItem onClick={onSaveClassifierClick}>Save classifier</MenuItem>
      </MenuList>
    </Menu>
  );
};
