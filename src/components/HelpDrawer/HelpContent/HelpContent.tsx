import { Box, Container, Divider, Typography } from "@mui/material";
import { ToolHotkeyTitle } from "components/tooltips/ToolHotkeyTitle/ToolHotkeyTitle";

import { CollapsibleList } from "components/CollapsibleList";

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
      {helpContent.map((helpContent: HelpTopic, idx: number) => {
        return (
          <CollapsibleList
            key={idx}
            primary={
              <Typography variant="h6" fontSize={18}>
                {helpContent.topic}
              </Typography>
            }
            closed={true}
            dense={true}
          >
            <Container>
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
                              <Typography fontSize={14}>
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
            </Container>
          </CollapsibleList>
        );
      })}
    </Box>
  );
};
