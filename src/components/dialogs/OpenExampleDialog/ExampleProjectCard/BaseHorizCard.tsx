import {
  Box,
  Card,
  CardActionArea,
  CardActions,
  CardContent,
  CardMedia,
  Divider,
  Link,
  Tooltip,
  Typography,
} from "@mui/material";

export const BaseHorizCard = ({
  title,
  action,
  image,
  description,
  sources,
  license,
}: {
  title: string;
  action: any;
  image?: string;
  description: string;
  sources: { sourceUrl: string; sourceName: string }[];
  license?: { licenseUrl?: string; licenseName?: string };
}) => {
  return (
    <Card
      sx={{
        maxWidth: "95%",
        width: "95%",
        mx: "auto",
        my: 2,
        height: "120px",
        backgroundColor: "transparent",
        backgroundImage: "none",
        boxShadow: "none",
        overflow: "visible",
      }}
    >
      <CardActionArea
        onClick={action}
        sx={{
          width: "100%",
          display: "flex",
          justifyContent: "flex-start",
          alignItems: "flex-start",
          backgroundColor: "transparent",
          p: 1,
        }}
      >
        {image && (
          <CardMedia
            component="img"
            image={image}
            alt={title}
            sx={{
              width: "120px",
              height: "120px",
              borderRadius: "4px",
            }}
          />
        )}
        <Box>
          <CardContent
            //sx={(theme) => ({ ":last-child": { pb: theme.spacing(1) } })}
            sx={{ py: 0 }}
          >
            <Typography variant="h5">{title}</Typography>
            <Divider variant="middle" />
            <Typography variant="body2" color="text.secondary">
              {description}
            </Typography>
          </CardContent>

          <CardActions sx={(theme) => ({ pl: theme.spacing(2), pb: 0 })}>
            {sources.map((source) => (
              <Tooltip
                key={source.sourceUrl}
                title={source.sourceUrl}
                disableInteractive
                enterDelay={50}
              >
                <Link
                  color="primary"
                  href={source.sourceUrl}
                  target="_blank"
                  rel="noreferrer"
                  underline="always"
                  variant="body2"
                  onClick={(event) => {
                    event.ctrlKey = true;
                    event.stopPropagation();
                  }}
                >
                  {source.sourceName}
                </Link>
              </Tooltip>
            ))}
            {license && (
              <Tooltip
                title={license.licenseName}
                disableInteractive
                enterDelay={50}
              >
                <Link
                  color="primary"
                  href={license.licenseUrl}
                  target="_blank"
                  rel="noreferrer"
                  underline="always"
                  variant="body2"
                  onClick={(event) => {
                    event.ctrlKey = true;
                    event.stopPropagation();
                  }}
                >
                  License
                </Link>
              </Tooltip>
            )}
          </CardActions>
        </Box>
      </CardActionArea>
    </Card>
  );
};
