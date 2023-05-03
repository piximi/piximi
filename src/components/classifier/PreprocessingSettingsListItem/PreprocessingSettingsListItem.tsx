import { RescalingForm } from "./RescalingForm";
import { CroppingForm } from "./CroppingForm";

import { CollapsibleList } from "components/common/styled-components/CollapsibleList";

export const PreprocessingSettingsListItem = () => {
  return (
    <CollapsibleList
      dense={false}
      primary="Preprocessing"
      disablePadding={false}
      paddingLeft={true}
    >
      <RescalingForm />
      <CroppingForm />
    </CollapsibleList>
  );
};
