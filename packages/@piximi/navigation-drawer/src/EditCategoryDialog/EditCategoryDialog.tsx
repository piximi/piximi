import {
  CategoryDescriptionTextField,
  ColorIconButton,
  AlertDialog,
  AlertDialogActions,
  AlertDialogContent,
  AlertDialogTitle
} from "@piximi/components";
import * as React from "react";
import {Category} from "@piximi/types";

export const colors = [
  "rgb(193,	 53,	19)", // r, 60s
  "rgb(248,	 52,  35)", // r, 70s
  "rgb(251,	  0,	66)", // r, 80s
  "rgb(159,	 40,	20)", // r, 90s
  "rgb(218,	 22,	69)", // r, 00s
  "rgb(251,	 31,	94)", // r, 10s
  "rgb( 99,	123,	38)", // g, 60s
  "rgb(100,	145,  65)", // g, 70s
  "rgb( 34,	227, 219)", // g, 80s
  "rgb( 34,	107, 141)", // g, 90s
  "rgb( 40,	209,	17)", // g, 00s
  "rgb( 44,	208,	83)", // g, 10s
  "rgb( 36,	 98, 121)", // b, 60s
  "rgb( 16, 143, 200)", // b, 70s
  "rgb( 44,  80, 191)", // b, 80s
  "rgb( 19,	 55, 160)", // b, 90s
  "rgb( 54, 133, 213)", // b, 00s
  "rgb( 12, 103, 254)" // b, 10s
];

type EditCategoryDialogProps = {
  category: Category;
  updateColor: (category: Category, color: string) => void;
  updateDescription: (category: Category, description: string) => void;
  onClose: () => void;
  open: boolean;
};

export const EditCategoryDialog = (props: EditCategoryDialogProps) => {
  const {category, updateColor, updateDescription, onClose, open} = props;

  const [color, setColor] = React.useState<string>(
    category.visualization.color
  );

  const [description, setDescription] = React.useState<string>(
    category.description
  );

  const onAcceptance = () => {
    updateColor(category, color);

    updateDescription(category, description);

    onClose();
  };

  const onColorChange = (color: any) => {
    setColor(color.hex);
  };

  const onDescriptionChange = (event: React.FormEvent<EventTarget>): void => {
    const target = event.target as HTMLInputElement;

    setDescription(target.value);
  };

  return (
    <AlertDialog open={open} onClose={onClose}>
      <AlertDialogTitle title="Edit category" />

      <AlertDialogContent>
        <ColorIconButton
          color={color}
          colors={colors}
          onColorChange={onColorChange}
        />

        <CategoryDescriptionTextField
          description={description}
          onDescriptionChange={onDescriptionChange}
        />
      </AlertDialogContent>

      <AlertDialogActions
        acceptanceTitle="Edit"
        cancellationTitle="Cancel"
        onAcceptance={onAcceptance}
        onCancellation={onClose}
      />
    </AlertDialog>
  );
};
