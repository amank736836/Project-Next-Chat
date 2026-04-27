"use client";

import { Delete as DeleteIcon } from "@mui/icons-material";
import { Logout as LogoutIcon } from "@mui/icons-material";
import { Box, IconButton, Stack, Tooltip, Typography } from "@mui/material";
import { motion } from "framer-motion";
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
  index = 0,
  handleDeleteChat,
  onSelectChat,
}) {
  return (
    <Link
      href={`/chat/${_id}`}
      style={{
        textDecoration: "none",
        padding: "0",
        backgroundColor: "rgba(255, 255, 255, 0.9)",
        boxShadow: "0px 4px 20px rgba(0, 0, 0, 0.1)",
        borderRadius: "8px",
        color: "inherit",
      }}
      onContextMenu={(e) => {
        e.preventDefault();
        handleDeleteChat(e, _id, groupChat);
      }}
      onClick={(e) => {
        if (sameSender) {
          e.preventDefault();
          return;
        }
        onSelectChat?.(_id);
      }}
    >
      <motion.div
        initial={false}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.08, ease: "easeInOut" }}
        style={{
          display: "flex",
          alignItems: "center",
          gap: "1rem",
          padding: "1rem",
          backgroundColor: sameSender ? "black" : "unset",
          color: sameSender ? "white" : "unset",
          position: "relative",
          borderRadius: "8px",
        }}
      >
        <AvatarCard avatar={avatar} />
        <Stack>
          <Typography>{name}</Typography>
          {newMessageCount > 0 && (
            <Typography>{newMessageCount} New Messages</Typography>
          )}
        </Stack>

        {Boolean(handleDeleteChat) && (
          <Tooltip title={groupChat ? "Leave group" : "Delete chat"} arrow>
            <IconButton
              size="medium"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                handleDeleteChat(e, _id, groupChat);
              }}
              sx={{
                position: "absolute",
                right: isOnline ? "2.4rem" : "0.5rem",
                top: "50%",
                transform: "translateY(-50%)",
                display: {
                  xs: "inline-flex",
                  sm: "none",
                },
                color: sameSender ? "white" : "#d32f2f",
                width: 34,
                height: 34,
                zIndex: 2,
              }}
            >
              {groupChat ? (
                <LogoutIcon fontSize="medium" />
              ) : (
                <DeleteIcon fontSize="medium" />
              )}
            </IconButton>
          </Tooltip>
        )}

        {isOnline && (
          <Box
            sx={{
              width: "10px",
              height: "10px",
              backgroundColor: "green",
              borderRadius: "50%",
              position: "absolute",
              right: "1rem",
              top: "50%",
              transform: "translateY(-50%)",
            }}
          />
        )}
      </motion.div>
    </Link>
  );
}

export default memo(ChatItem);
