import { PartialDivider } from "components/ui/divider/PartialDivider";

export const SectionDivider = ({ text }: { text: string }) => {
  return (
    <PartialDivider
      containerStyle={{ width: "100%" }}
      typographyVariant="body2"
      headerText={text}
      textTransform="uppercase"
      indentPercentage={12}
    />
  );
};
