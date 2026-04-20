"use client";

import { Add as AddIcon, Remove as RemoveIcon } from "@mui/icons-material";
import { Avatar, IconButton, ListItem, Stack, Typography } from "@mui/material";
import { transformImageUrl } from "../../lib/features";

export default function UserItem({
  user,
  handler,
  handlerIsLoading = null,
  isAdded = false,
  styling = {},
}) {
  const userId = user?._id || user?.id;
  const { name, avatar } = user;

  return (
    <ListItem>
      <Stack
        direction={"row"}
        alignItems={"center"}
        spacing={"1rem"}
        width={"100%"}
        {...styling}
      >
        <Avatar src={transformImageUrl(avatar)} />
        <Typography
          variant="body1"
          sx={{
            flexGrow: 1,
            display: "-webkit-box",
            WebkitLineClamp: 1,
            WebkitBoxOrient: "vertical",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
        >
          {name}
        </Typography>

        <IconButton
          onClick={() => handler(userId)}
          disabled={handlerIsLoading}
          size="small"
          sx={{
            bgcolor: isAdded ? "error.main" : "primary.main",
            color: "white",
            "&:hover": {
              bgcolor: isAdded ? "error.dark" : "primary.dark",
            },
            "&:disabled": {
              bgcolor: "darkorchid",
              color: "white",
            },
          }}
        >
          {isAdded ? (
            <RemoveIcon fontSize="small" />
          ) : (
            <AddIcon fontSize="small" />
          )}
        </IconButton>
      </Stack>
    </ListItem>
  );
}
