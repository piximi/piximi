import {
  Box,
  Card,
  CardActionArea,
  CardActions,
  CardContent,
  CardHeader,
  CardMedia,
  Divider,
  Grid,
  Link,
  Tooltip,
  Typography,
} from "@mui/material";

export const BaseHorizCard = ({
  title,
  action,
  image,
  description,
  source,
  license,
}: {
  title: string;
  action: any;
  image?: string;
  description: string;
  source: { sourceUrl: string; sourceName: string };
  license?: { licenseUrl?: string; licenseName?: string };
}) => {
  return (
    <Card
      sx={{
        maxWidth: "95%",
        width: "95%",
        mx: "auto",
        my: 2,
        height: "fit-content",
      }}
    >
      <CardActionArea onClick={action} sx={{ width: "100%" }}>
        <Grid container gap={1} paddingX={1}>
          {image && (
            <Grid
              item
              sm={2}
              display="flex"
              flexDirection="column"
              justifyContent="center"
            >
              <CardMedia
                component="img"
                //height="100%"
                image={image}
                alt={title}
                sx={{ my: "auto" }}
              />
            </Grid>
          )}
          <Grid
            item
            sm={image ? 9 : 12}
            display="flex"
            flexDirection="column"
            justifyContent="space-between"
          >
            <Box>
              <CardHeader title={title} />
              <Divider variant="middle" />
              <CardContent
                sx={(theme) => ({ ":last-child": { pb: theme.spacing(1) } })}
              >
                <Typography variant="body2" color="text.secondary">
                  {description}
                </Typography>
              </CardContent>
            </Box>

            <CardActions sx={(theme) => ({ pl: theme.spacing(2) })}>
              <Tooltip
                title={source.sourceName}
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
                  Source
                </Link>
              </Tooltip>
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
          </Grid>
        </Grid>
      </CardActionArea>
    </Card>
  );
};
