import { Box, Divider, List, Typography } from "@mui/material";
import { ToolHotkeyTitle } from "components/tooltips/ToolHotkeyTitle/ToolHotkeyTitle";

import { CollapsibleListItem } from "components/list-items/CollapsibleListItem";

type Subtopic = {
  subtitle: string;
  tootleTitle?: ToolTitleProps;
  descriptions: Array<string>;
};

type HelpTopic = {
  topic: string;
  subtopics: Array<Subtopic>;
};

type ToolTitleProps = {
  toolName: string;
  letter: string;
};

export type HelpContentType = {
  error: string;
  appBarOffset: boolean;
  topics: Array<HelpTopic>;
};

export const HelpContent = (helpContent: Array<HelpTopic>) => {
  return (
    <Box>
      <List>
        {helpContent.map((helpContent: HelpTopic, idx: number) => {
          return (
            <CollapsibleListItem
              key={idx}
              primaryText={
                <Typography variant="h6" fontSize={18}>
                  {helpContent.topic}
                </Typography>
              }
              dense
              indentSpacing={2}
              enforceHeight="lg"
            >
              <List component="div" dense sx={{ pr: 2 }}>
                {helpContent.subtopics.map(
                  (subTopic: Subtopic, subtopicIndex: number) => {
                    return (
                      <Box key={subtopicIndex}>
                        {subTopic.tootleTitle ? (
                          <ToolHotkeyTitle
                            toolName={subTopic.tootleTitle.toolName}
                            letter={subTopic.tootleTitle.letter}
                            bold={true}
                          />
                        ) : (
                          <Typography paddingBottom={1} fontWeight="bold">
                            {subTopic.subtitle}
                          </Typography>
                        )}
                        {subTopic.descriptions.map(
                          (description: string, descriptionIndex: number) => {
                            return (
                              <Box key={descriptionIndex}>
                                <Typography fontSize={14} align="justify">
                                  {description}
                                </Typography>
                              </Box>
                            );
                          }
                        )}
                        {subtopicIndex < helpContent.subtopics.length - 1 && (
                          <Divider sx={{ my: 2 }} />
                        )}
                      </Box>
                    );
                  }
                )}
              </List>
            </CollapsibleListItem>
          );
        })}
      </List>
    </Box>
  );
};
