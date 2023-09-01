import { CroppingForm, RescalingForm } from "components/forms";

import { CollapsibleListItem } from "../CollapsibleListItem";

export const PreprocessingSettingsListItem = () => {
  return (
    <CollapsibleListItem
      dense={false}
      primaryText="Preprocessing"
      carotPosition="start"
      divider={true}
    >
      <RescalingForm />
      <CroppingForm />
    </CollapsibleListItem>
  );
};
