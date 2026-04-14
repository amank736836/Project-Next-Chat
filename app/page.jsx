"use client";

import { Box, Stack, Typography, Drawer, Grid, Skeleton } from "@mui/material";
import { useCallback, useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";
import { useDispatch, useSelector } from "react-redux";
import { gradientBg } from "../constants/color";
import {
  NEW_MESSAGE_ALERT,
  NEW_REQUEST,
  ONLINE_USERS,
  REFETCH_CHATS,
} from "../constants/events";
import { useErrors, useSocketEvents } from "../hooks/useHooks";
import { getOrSaveFromStorage } from "../lib/features";
import { useGetMyChatsQuery } from "../redux/api/api";
import {
  incrementNotificationCount,
  setNewMessagesAlert,
} from "../redux/reducers/chat.reducer";
import {
  setIsDeleteMenu,
  setIsMobile,
  setIsProfile,
  setSelectedDeleteChat,
} from "../redux/reducers/misc.reducer";
import { useSocket } from "../providers/SocketProvider";
import Header from "../components/layout/Header";
import ChatList from "../components/shared/ChatList";
import Profile from "../components/shared/Profile";
import DeleteChatMenu from "../components/dialog/DeleteChatMenu";
import ProtectedRoute from "../components/auth/ProtectedRoute";

function HomeContent() {
  const { newMessagesAlert } = useSelector((state) => state.chat);
  const { isMobile, isProfile } = useSelector((state) => state.misc);
  const { user } = useSelector((state) => state.auth);

  const [onlineUsers, setOnlineUsers] = useState([]);
  const dispatch = useDispatch();
  const socket = useSocket();
  const deleteOptionAnchor = useRef(null);

  const handleMobileClose = () => {
    dispatch(setIsMobile(false));
  };

  const handleProfileClose = () => {
    dispatch(setIsProfile(false));
  };

  const {
    data: chatsData,
    isLoading: isLoadingChats,
    isError: isErrorChats,
    error: errorChats,
    refetch: refetchChats,
  } = useGetMyChatsQuery("");

  useErrors([
    {
      isError: isErrorChats,
      error: errorChats,
    },
  ]);

  const handleDeleteChat = (e, chatId, groupChat) => {
    e.preventDefault();
    deleteOptionAnchor.current = e.currentTarget;
    dispatch(setIsDeleteMenu(true));
    dispatch(setSelectedDeleteChat({ chatId, groupChat }));
  };

  const newMessagesAlertListener = useCallback(
    (data) => {
      dispatch(setNewMessagesAlert(data));
    },
    [dispatch]
  );

  const newRequestListener = useCallback(() => {
    dispatch(incrementNotificationCount());
  }, [dispatch]);

  const refetchChatsListener = useCallback(
    (data) => {
      if (data) {
        toast.success(data, {
          duration: 1000,
        });
      }
      refetchChats();
      window.location.href = "/";
    },
    [refetchChats]
  );

  const onlineUsersListener = useCallback((data) => {
    setOnlineUsers(data.onlineUsers);
  }, []);

  const eventHandlers = {
    [NEW_MESSAGE_ALERT]: newMessagesAlertListener,
    [NEW_REQUEST]: newRequestListener,
    [REFETCH_CHATS]: refetchChatsListener,
    [ONLINE_USERS]: onlineUsersListener,
  };

  useSocketEvents(socket, eventHandlers);

  useEffect(() => {
    getOrSaveFromStorage({
      key: NEW_MESSAGE_ALERT,
      value: newMessagesAlert,
    });
  }, [newMessagesAlert]);

  return (
    <>
      <Header />
      <DeleteChatMenu deleteOptionAnchor={deleteOptionAnchor} />

      {isLoadingChats ? (
        <Skeleton />
      ) : (
        <Drawer
          open={isMobile}
          onClose={handleMobileClose}
          anchor="right"
          sx={{
            "& .MuiDrawer-paper": {
              width: "80vw",
              background: gradientBg,
              boxShadow: "0px 4px 12px rgba(0, 0, 0, 0.1)",
            },
          }}
          onClick={handleMobileClose}
        >
          <ChatList
            w="80vw"
            chats={chatsData?.chats}
            chatId={null}
            newMessagesAlert={newMessagesAlert}
            onlineUsers={onlineUsers}
            handleDeleteChat={handleDeleteChat}
          />
        </Drawer>
      )}

      {isLoadingChats ? (
        <Skeleton />
      ) : (
        <Drawer
          open={isProfile}
          onClose={handleProfileClose}
          anchor="left"
          sx={{
            "& .MuiDrawer-paper": {
              width: {
                xs: "85vw",
                sm: "75vw",
                md: "42vw",
              },
              background: gradientBg,
              boxShadow: "0px 4px 12px rgba(0, 0, 0, 0.1)",
            },
          }}
        >
          <Profile />
        </Drawer>
      )}

      <Grid container height={"calc(100vh - 4rem)"}>
        <Grid
          size={{ sm: 4, md: 5, lg: 3 }}
          sx={{
            display: { xs: "none", sm: "block" },
            background: gradientBg,
          }}
          height={"100%"}
        >
          {isLoadingChats ? (
            <Stack spacing={"1rem"}>
              {Array.from({ length: 8 }, (_, index) => (
                <Skeleton key={index} variant="rounded" height={95} />
              ))}
            </Stack>
          ) : (
            <ChatList
              chats={chatsData?.chats}
              chatId={null}
              newMessagesAlert={newMessagesAlert}
              onlineUsers={onlineUsers}
              handleDeleteChat={handleDeleteChat}
            />
          )}
        </Grid>

        <Grid size={{ sm: 8, md: 7, lg: 6, xs: 12 }} height={"100%"}>
          <Box
            sx={{
              minHeight: "calc(100vh - 4rem)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: gradientBg,
              padding: "1rem",
            }}
          >
            <Stack
              spacing={3}
              sx={{
                maxWidth: "600px",
                padding: "2rem",
                borderRadius: "12px",
                backgroundColor: "rgba(255, 255, 255, 0.9)",
                boxShadow: "0px 4px 20px rgba(0, 0, 0, 0.1)",
                textAlign: "center",
              }}
            >
              <Typography variant="h4" fontWeight={600} color="primary">
                Welcome to Chat App!
              </Typography>
              <Typography variant="h6" color="textSecondary">
                A modern chat application with authentication, group chat, and
                anonymous messaging.
              </Typography>
              <Typography variant="body1" color="textSecondary">
                ✨ Create and manage groups effortlessly.
              </Typography>
              <Typography variant="body1" color="textSecondary">
                🔒 Chat anonymously with random users.
              </Typography>
              <Typography variant="body1" color="textSecondary">
                🎉 Enjoy a seamless and user-friendly experience.
              </Typography>
              <Typography variant="h6" fontWeight={500} color="secondary">
                Select a chat to start messaging!
              </Typography>
            </Stack>
          </Box>
        </Grid>

        <Grid
          size={{ lg: 3 }}
          sx={{
            display: { xs: "none", lg: "block" },
          }}
          height={"100%"}
        >
          <Profile />
        </Grid>
      </Grid>
    </>
  );
}

export default function Home() {
  return (
    <ProtectedRoute>
      <HomeContent />
    </ProtectedRoute>
  );
}
