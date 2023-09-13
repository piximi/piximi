import React from "react";
import {
  Card,
  CardActionArea,
  CardActions,
  CardContent,
  CardMedia,
  Link,
  Tooltip,
  Typography,
} from "@mui/material";

export const BaseVertCard = ({
  title,
  image,
  action,
  description,
  source,
  license,
}: {
  title: string;
  action: any;
  image?: string;
  description: string;
  source: { sourceName: string; sourceUrl: string };
  license?: { licenseUrl: string; licenseName: string } | undefined;
}) => {
  return (
    <Card
      sx={{
        maxWidth: 345,
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
      }}
    >
      <CardActionArea onClick={action}>
        <CardMedia
          component="img"
          height="140"
          image={image}
          alt={title}
          sx={{ "& .MuiCardMedia-img": {} }}
        />
        <CardContent>
          <Typography gutterBottom variant="h5" component="div">
            {title}
          </Typography>
          <Typography
            variant="body2"
            color="text.secondary"
            textAlign="justify"
          >
            {description}
          </Typography>
        </CardContent>
      </CardActionArea>
      <CardActions>
        <Tooltip title={source.sourceName} disableInteractive enterDelay={50}>
          <Link
            color="primary"
            href={source.sourceUrl}
            target="_blank"
            rel="noreferrer"
            underline="always"
            variant="body2"
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
            >
              License
            </Link>
          </Tooltip>
        )}
      </CardActions>
    </Card>
  );
};
