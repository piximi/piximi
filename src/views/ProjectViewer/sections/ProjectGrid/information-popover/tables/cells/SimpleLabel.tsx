import { Typography } from "@mui/material";

export const SimpleLabel = ({ value }: { value: string | number }) => {
  return <Typography sx={{ fontSize: "inherit" }}>{value}</Typography>;
};
