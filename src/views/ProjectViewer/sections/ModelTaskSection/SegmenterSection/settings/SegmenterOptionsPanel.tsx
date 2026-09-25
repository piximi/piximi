import { Box, Button, Collapse, Divider, Typography } from "@mui/material";

import { isFieldVisible } from "core/dl/segmentation/optionUtils";

import { useSegmenterStatus } from "@ProjectViewer/contexts/SegmenterStatusProvider";

import { SegmenterOptionInput } from "./SegmenterOptionInput";

import type { SegmenterOptionField } from "core/dl/segmentation/types";

/*
 * Renders whatever inference knobs the loaded model declares. The panel knows
 * nothing about any particular model — a segmenter without an `optionSchema`
 * simply renders nothing.
 */
export const SegmenterOptionsPanel = ({
  showAdvanced,
}: {
  showAdvanced: boolean;
}) => {
  const { optionValues, resetOptions, schema } = useSegmenterStatus();

  const visible = (fields: SegmenterOptionField[], advanced: boolean) =>
    fields.filter(
      (field) =>
        !!field.advanced === advanced && isFieldVisible(field, optionValues),
    );

  return !schema ? null : (
    <Box sx={{ display: "flex", flexDirection: "column", width: "100%" }}>
      {/* "channels" groups render in the channel section, next to the picker. */}
      {schema.groups
        .filter((group) => !group.describesChannels)
        .map((group) => {
          const primary = visible(group.fields, false);
          const advanced = visible(group.fields, true);

          if (primary.length === 0 && advanced.length === 0) return null;

          const onlyAdvanced = primary.length === 0 && advanced.length > 0;

          return (
            <Box key={group.id} sx={{ pb: 1 }}>
              {!onlyAdvanced && (
                <Divider sx={{ mb: 0.75 }}>
                  <Typography variant="caption" color="text.disabled">
                    {group.label}
                  </Typography>
                </Divider>
              )}

              {primary.map((field) => (
                <SegmenterOptionInput key={`${field.key}`} field={field} />
              ))}

              <Collapse in={showAdvanced} unmountOnExit>
                <>
                  {onlyAdvanced && (
                    <Divider sx={{ mb: 0.75 }}>
                      <Typography variant="caption" color="text.disabled">
                        {group.label}
                      </Typography>
                    </Divider>
                  )}
                  {advanced.map((field) => (
                    <SegmenterOptionInput key={`${field.key}`} field={field} />
                  ))}
                </>
              </Collapse>
            </Box>
          );
        })}
      <Button
        size="small"
        onClick={resetOptions}
        sx={{
          font: "var(--mui-font-caption)",
          textTransform: "none",
          alignSelf: "flex-end",
        }}
      >
        Restore defaults
      </Button>
    </Box>
  );
};
