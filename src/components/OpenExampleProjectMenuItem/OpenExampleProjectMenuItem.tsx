import { classifierSlice, projectSlice } from "../../store/slices";
import { useDispatch } from "react-redux";
import { Avatar, ListItem, ListItemAvatar, ListItemText } from "@mui/material";
import { SerializedProjectType } from "../../types/SerializedProjectType";
import { Classifier } from "../../types/Classifier";

type OpenExampleProjectMenuItemProps = {
  exampleProject: any;
  primary: string;
  popupState: any;
  onClose: any;
};

export const OpenExampleProjectMenuItem = ({
  exampleProject,
  primary,
  popupState,
  onClose,
}: OpenExampleProjectMenuItemProps) => {
  const dispatch = useDispatch();
  const projectIcon = exampleProject.project.serializedImages[0].imageData;

  const onClickExampleProject = async () => {
    const project = exampleProject.project as SerializedProjectType;
    const classifier = exampleProject.classifier as Classifier;

    popupState.close();
    onClose();

    dispatch(
      projectSlice.actions.openProject({
        images: project.serializedImages,
        categories: project.categories,
        name: project.name,
      })
    );

    dispatch(
      classifierSlice.actions.setClassifier({
        classifier: classifier,
      })
    );
  };

  return (
    <ListItem button onClick={onClickExampleProject}>
      <ListItemAvatar>
        <Avatar src={projectIcon}></Avatar>
      </ListItemAvatar>

      <ListItemText primary={primary} />
    </ListItem>
  );
};
