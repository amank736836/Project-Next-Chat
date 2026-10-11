"use client";

import { DeleteOutlined as DeleteOutline, Logout } from "@mui/icons-material";
import {
  Box,
  Chip,
  IconButton,
  Stack,
  Tooltip,
  Typography,
} from "@mui/material";
import Link from "next/link";
import { memo } from "react";
import AvatarCard from "./AvatarCard";

function ChatItem({
  avatar = [],
  name = "Unknown",
  _id = "",
  groupChat = false,
  sameSender = false,
  isOnline = false,
  newMessageCount = 0,
  handleDeleteChat,
  onSelectChat,
}) {
  return (
    <Box className="chat-list-row" sx={{ position: "relative" }}>
      <Link
        className="chat-list-link"
        href={`/chat/${_id}`}
        aria-current={sameSender ? "page" : undefined}
        onContextMenu={
          handleDeleteChat
            ? (e) => {
                e.preventDefault();
                handleDeleteChat(e, _id, groupChat);
              }
            : undefined
        }
        onClick={(e) => {
          if (sameSender) {
            e.preventDefault();
            return;
          }
          onSelectChat?.(_id);
        }}
      >
        <Stack
          direction="row"
          alignItems="center"
          spacing={1.5}
          sx={{ p: 1.5, pr: handleDeleteChat ? 5 : 1.5, minHeight: 82 }}
        >
          <Box sx={{ position: "relative", flexShrink: 0 }}>
            <AvatarCard avatar={avatar} />
            {isOnline && (
              <Box
                aria-label="Online"
                sx={{
                  position: "absolute",
                  right: 0,
                  bottom: 0,
                  width: 11,
                  height: 11,
                  border: "2px solid white",
                  borderRadius: "50%",
                  bgcolor: "var(--champ-primary)",
                }}
              />
            )}
          </Box>
          <Box sx={{ minWidth: 0, flex: 1 }}>
            <Typography
              noWrap
              fontSize={14}
              fontWeight={sameSender || newMessageCount ? 750 : 600}
            >
              {name}
            </Typography>
            <Typography
              noWrap
              variant="caption"
              color={newMessageCount ? "primary.main" : "text.secondary"}
            >
              {newMessageCount
                ? `${newMessageCount} new ${newMessageCount === 1 ? "message" : "messages"}`
                : groupChat
                  ? "Group conversation"
                  : isOnline
                    ? "Online now"
                    : "Direct message"}
            </Typography>
          </Box>
          {newMessageCount > 0 && (
            <Chip
              size="small"
              color="primary"
              label={newMessageCount > 99 ? "99+" : newMessageCount}
              sx={{ height: 22, fontSize: 11 }}
            />
          )}
        </Stack>
      </Link>
      {handleDeleteChat && (
        <Tooltip title={groupChat ? "Leave group" : "Delete chat"}>
          <IconButton
            className="chat-item-action"
            aria-label={`${groupChat ? "Leave group" : "Delete chat"}: ${name}`}
            size="small"
            onClick={(e) => handleDeleteChat(e, _id, groupChat)}
            sx={{
              position: "absolute",
              right: 6,
              top: 26,
              color: "text.secondary",
              "&:hover": { color: "error.main" },
            }}
          >
            {groupChat ? (
              <Logout fontSize="small" />
            ) : (
              <DeleteOutline fontSize="small" />
            )}
          </IconButton>
        </Tooltip>
      )}
    </Box>
  );
}
export default memo(ChatItem);
