import Typography from "@mui/material/Typography";
import { Box, Container } from "@mui/material";
import Divider from "@mui/material/Divider";
import { CollapsibleHelpContent } from "../HelpDialog/CollapsibleHelpContent";
import {
  HelpWindowToolTitle,
  ToolTitleProps,
} from "../HelpDialog/HelpWindowToolTitle";

export type Subtopic = {
  subtitle: string;
  tootleTitle?: ToolTitleProps;
  descriptions: Array<string>;
};

export type HelpTopic = {
  topic: string;
  subtopics: Array<Subtopic>;
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
                        <HelpWindowToolTitle
                          toolName={subTopic.tootleTitle.toolName}
                          letter={subTopic.tootleTitle.letter}
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
