"use client";

import { Stack } from "@mui/material";
import { memo, useMemo } from "react";
import ChatItem from "./ChatItem";

function ChatList({
  w = "100%",
  chats = [],
  chatId,
  onlineUsers = [],
  handleDeleteChat,
  newMessagesAlert = [],
  onSelectChat,
}) {
  const chatItems = useMemo(
    () =>
      chats.map((data, index) => {
        const { _id, avatar, name, groupChat, members = [] } = data;

        const newMessageCount = newMessagesAlert.find(
          ({ chatId }) => chatId === _id
        );

        const isOnline = members?.some((member) =>
          onlineUsers.includes(member)
        );

        return (
          <ChatItem
            index={index}
            newMessageCount={newMessageCount?.count || 0}
            isOnline={isOnline}
            avatar={avatar}
            name={name}
            _id={_id}
            key={_id}
            groupChat={groupChat}
            sameSender={_id === chatId}
            handleDeleteChat={handleDeleteChat}
            onSelectChat={onSelectChat}
          />
        );
      }),
    [chats, newMessagesAlert, onlineUsers, chatId, handleDeleteChat, onSelectChat]
  );

  return (
    <Stack
      height={"100%"}
      width={w}
      direction={"column"}
      spacing={2}
      sx={{
        p: {
          xs: "0.5rem",
          sm: "1rem",
        },
        overflow: "auto",
        "&::-webkit-scrollbar": {
          display: "none",
        },
      }}
    >
      {chatItems}
    </Stack>
  );
}

export default memo(ChatList);
