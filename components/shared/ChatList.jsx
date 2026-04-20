"use client";

import { Stack } from "@mui/material";
import { memo, useCallback, useEffect, useMemo, useState } from "react";
import ChatItem from "./ChatItem";

const CHAT_LIST_WINDOW_STEP = 40;

function ChatList({
  w = "100%",
  chats = [],
  chatId,
  onlineUsers = [],
  handleDeleteChat,
  newMessagesAlert = [],
  onSelectChat,
}) {
  const [visibleCount, setVisibleCount] = useState(CHAT_LIST_WINDOW_STEP);

  useEffect(() => {
    setVisibleCount(CHAT_LIST_WINDOW_STEP);
  }, [chats]);

  const visibleChats = useMemo(
    () => chats.slice(0, Math.min(visibleCount, chats.length)),
    [chats, visibleCount]
  );

  const handleScroll = useCallback(
    (event) => {
      const list = event.currentTarget;
      const nearBottom = list.scrollTop + list.clientHeight >= list.scrollHeight - 120;

      if (nearBottom && visibleCount < chats.length) {
        setVisibleCount((prev) => Math.min(prev + CHAT_LIST_WINDOW_STEP, chats.length));
      }
    },
    [visibleCount, chats.length]
  );

  const chatItems = useMemo(
    () =>
      visibleChats.map((data, index) => {
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
    [visibleChats, newMessagesAlert, onlineUsers, chatId, handleDeleteChat, onSelectChat]
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
      onScroll={handleScroll}
    >
      {chatItems}
    </Stack>
  );
}

export default memo(ChatList);
