"use client";

import {
  Box,
  Chip,
  InputAdornment,
  Stack,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from "@mui/material";
import { memo, useCallback, useEffect, useMemo, useState } from "react";
import { SearchRounded } from "@mui/icons-material";
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
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const filteredChats = useMemo(
    () =>
      chats.filter(
        (chat) =>
          (chat.name || "")
            .toLowerCase()
            .includes(search.trim().toLowerCase()) &&
          (filter === "all" ||
            (filter === "groups" ? chat.groupChat : !chat.groupChat)),
      ),
    [chats, search, filter],
  );
  const [visibleCount, setVisibleCount] = useState(CHAT_LIST_WINDOW_STEP);

  useEffect(() => {
    setVisibleCount(CHAT_LIST_WINDOW_STEP);
  }, [chats.length, search, filter]);

  const visibleChats = useMemo(
    () => filteredChats.slice(0, Math.min(visibleCount, filteredChats.length)),
    [filteredChats, visibleCount],
  );

  const handleScroll = useCallback(
    (event) => {
      const list = event.currentTarget;
      const nearBottom =
        list.scrollTop + list.clientHeight >= list.scrollHeight - 120;

      if (nearBottom && visibleCount < filteredChats.length) {
        setVisibleCount((prev) =>
          Math.min(prev + CHAT_LIST_WINDOW_STEP, filteredChats.length),
        );
      }
    },
    [visibleCount, filteredChats.length],
  );

  const chatItems = useMemo(
    () =>
      visibleChats.map((data, index) => {
        const { _id, avatar, name, groupChat, members = [] } = data;

        const newMessageCount = newMessagesAlert.find(
          ({ chatId }) => chatId === _id,
        );

        const isOnline = members?.some((member) =>
          onlineUsers.includes(member),
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
    [
      visibleChats,
      newMessagesAlert,
      onlineUsers,
      chatId,
      handleDeleteChat,
      onSelectChat,
    ],
  );

  return (
    <Stack
      className="workspace-root"
      height="100%"
      width={w}
      sx={{ bgcolor: "white", borderRight: "1px solid #e7ecf4", minHeight: 0 }}
    >
      <Box sx={{ p: 2.5, pb: 1.5 }}>
        <Stack
          direction="row"
          alignItems="center"
          justifyContent="space-between"
          sx={{ mb: 2 }}
        >
          <Typography component="h2" variant="h6">
            Messages
          </Typography>
          <Chip
            label={chats.length}
            size="small"
            sx={{ bgcolor: "#edf1ff", color: "primary.main", fontWeight: 700 }}
          />
        </Stack>
        <TextField
          fullWidth
          size="small"
          placeholder="Find a conversation"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          slotProps={{
            htmlInput: { "aria-label": "Find a conversation" },
            input: {
              startAdornment: (
                <InputAdornment position="start">
                  <SearchRounded fontSize="small" />
                </InputAdornment>
              ),
            },
          }}
        />
        <ToggleButtonGroup
          exclusive
          value={filter}
          onChange={(_, value) => value && setFilter(value)}
          size="small"
          aria-label="Conversation type"
          sx={{
            mt: 2,
            gap: 0.5,
            "& .MuiToggleButton-root": {
              border: 0,
              borderRadius: "8px !important",
              px: 1.5,
              py: 0.5,
              textTransform: "none",
            },
            "& .Mui-selected": {
              color: "primary.main",
              bgcolor: "#edf1ff !important",
            },
          }}
        >
          <ToggleButton value="all">All</ToggleButton>
          <ToggleButton value="direct">Direct</ToggleButton>
          <ToggleButton value="groups">Groups</ToggleButton>
        </ToggleButtonGroup>
      </Box>
      <Stack
        spacing={0.5}
        sx={{ px: 1.5, pb: 2, flex: 1, minHeight: 0, overflowY: "auto" }}
        onScroll={handleScroll}
      >
        {chatItems}
        {filteredChats.length === 0 && (
          <Box sx={{ p: 3, textAlign: "center" }}>
            <Typography fontWeight={600}>
              {chats.length
                ? "No conversations found"
                : "Your inbox starts here"}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              {chats.length
                ? "Try a different name or filter."
                : "Use Search in the toolbar to find a friend and connect."}
            </Typography>
          </Box>
        )}
      </Stack>
    </Stack>
  );
}

export default memo(ChatList);
