import { Box, Container, Divider, Typography } from "@mui/material";
import { ToolHotkeyTitle } from "../../ToolHotkeyTitle";

import { CollapsibleHelpContent } from "../HelpDialog/CollapsibleHelpContent";
import { ToolTitleProps } from "../HelpDialog/HelpWindowToolTitle";

export type Subtopic = {
  subtitle: string;
  tootleTitle?: ToolTitleProps;
  descriptions: Array<string>;
};

export type HelpTopic = {
  topic: string;
  subtopics: Array<Subtopic>;
};

export type HelpContentType = {
  error: string;
  appBarOffset: boolean;
  topics: Array<HelpTopic>;
};

export const HelpContent = (helpContent: Array<HelpTopic>) => {
  return (
    <div>
      {helpContent.map((helpContent: HelpTopic, idx: number) => {
        return (
          <CollapsibleHelpContent
            key={idx}
            primary={helpContent.topic}
            closed={false}
            dense={true}
          >
            <Container>
              {helpContent.subtopics.map(
                (subTopic: Subtopic, subtopicIndex: number) => {
                  return (
                    <div key={subtopicIndex}>
                      {subTopic.tootleTitle ? (
                        <ToolHotkeyTitle
                          toolName={subTopic.tootleTitle.toolName}
                          letter={subTopic.tootleTitle.letter}
                          bold={true}
                        />
                      ) : (
                        <Typography component={"span"}>
                          <Box fontWeight="fontWeightBold">
                            {subTopic.subtitle}
                          </Box>
                        </Typography>
                      )}
                      {subTopic.descriptions.map(
                        (description: string, descriptionIndex: number) => {
                          return (
                            <div key={descriptionIndex}>
                              <Typography component={"span"}>
                                {description}
                              </Typography>
                              <br />
                            </div>
                          );
                        }
                      )}
                      <Divider />
                      <br />
                    </div>
                  );
                }
              )}
            </Container>
          </CollapsibleHelpContent>
        );
      })}
    </div>
  );
};
