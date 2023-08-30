import { RescalingForm } from "./RescalingForm";
import { CroppingForm } from "./CroppingForm";

import { CollapsibleList } from "components/lists";

export const PreprocessingSettingsListItem = () => {
  return (
    <CollapsibleList
      dense={false}
      primary="Preprocessing"
      disablePadding={false}
      paddingLeft={true}
      closed={true}
    >
      <RescalingForm />
      <CroppingForm />
    </CollapsibleList>
  );
};
