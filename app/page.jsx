"use client";

import { Box, Button, Stack, Typography, Drawer, Grid, Skeleton } from "@mui/material";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import dynamic from "next/dynamic";
import toast from "react-hot-toast";
import { shallowEqual, useDispatch, useSelector } from "react-redux";
import WorkspaceEmpty from "../components/shared/WorkspaceEmpty";
import { ForumOutlined, GroupAddOutlined } from "@mui/icons-material";
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
  setIsSearch,
  setIsNewGroup,
  setIsProfile,
  setSelectedDeleteChat,
} from "../redux/reducers/misc.reducer";
import { useSocket } from "../providers/SocketProvider";
import DeleteChatMenu from "../components/dialog/DeleteChatMenu";
import ProtectedRoute from "../components/auth/ProtectedRoute";

const Header = dynamic(() => import("../components/layout/Header"));
const ChatList = dynamic(() => import("../components/shared/ChatList"));
const Profile = dynamic(() => import("../components/shared/Profile"));

function HomeContent() {
  const { newMessagesAlert } = useSelector((state) => state.chat);
  const { isMobile, isProfile } = useSelector(
    (state) => ({
      isMobile: state.misc.isMobile,
      isProfile: state.misc.isProfile,
    }),
    shallowEqual
  );

  const [onlineUsers, setOnlineUsers] = useState([]);
  const dispatch = useDispatch();
  const socket = useSocket();
  const deleteOptionAnchor = useRef(null);

  const handleMobileClose = useCallback(() => {
    dispatch(setIsMobile(false));
  }, [dispatch]);

  const handleProfileClose = useCallback(() => {
    dispatch(setIsProfile(false));
  }, [dispatch]);

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

  const handleDeleteChat = useCallback((e, chatId, groupChat) => {
    e.preventDefault();
    deleteOptionAnchor.current = e.currentTarget;
    dispatch(setIsDeleteMenu(true));
    dispatch(setSelectedDeleteChat({ chatId, groupChat }));
  }, [dispatch]);

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

  const eventHandlers = useMemo(
    () => ({
      [NEW_MESSAGE_ALERT]: newMessagesAlertListener,
      [NEW_REQUEST]: newRequestListener,
      [REFETCH_CHATS]: refetchChatsListener,
      [ONLINE_USERS]: onlineUsersListener,
    }),
    [
      newMessagesAlertListener,
      newRequestListener,
      refetchChatsListener,
      onlineUsersListener,
    ]
  );

  const hasChatListData = useMemo(
    () => (chatsData?.chats?.length || 0) > 0,
    [chatsData?.chats]
  );
  const chatListData = useMemo(() => chatsData?.chats || [], [chatsData?.chats]);
  const chatListSkeleton = useMemo(
    () =>
      Array.from({ length: 8 }, (_, index) => (
        <Skeleton key={index} variant="rounded" height={95} />
      )),
    []
  );

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

      {isLoadingChats && !hasChatListData ? (
        <Skeleton />
      ) : (
        <Drawer
          open={isMobile}
          onClose={handleMobileClose}
          anchor="right"
          sx={{
            "& .MuiDrawer-paper": {
              width: "80vw",
              background: "#f5f7fb",
              boxShadow: "0px 4px 12px rgba(0, 0, 0, 0.1)",
            },
          }}
        >
          <ChatList
            onSelectChat={handleMobileClose}
            w="80vw"
            chats={chatListData}
            chatId={null}
            newMessagesAlert={newMessagesAlert}
            onlineUsers={onlineUsers}
            handleDeleteChat={handleDeleteChat}
          />
        </Drawer>
      )}

      {isLoadingChats && !hasChatListData ? (
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
              background: "#f5f7fb",
              boxShadow: "0px 4px 12px rgba(0, 0, 0, 0.1)",
            },
          }}
        >
          <Profile />
        </Drawer>
      )}

      <Grid className="workspace-root" container height="calc(100dvh - 64px)">
        <Grid
          size={{ sm: 4, md: 5, lg: 3 }}
          sx={{
            display: { xs: "none", sm: "block" },
            background: "#f5f7fb",
          }}
          height={"100%"}
        >
          {isLoadingChats ? (
            <Stack spacing={"1rem"}>
              {chatListSkeleton}
            </Stack>
          ) : (
            <ChatList
              chats={chatListData}
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
              height: "100%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: "#f5f7fb",
              padding: "1rem",
            }}
          >
            <WorkspaceEmpty title="Good conversations start here." description="A quick hello. A shared idea. Your next great conversation is just a message away.">
              <Button variant="contained" startIcon={<ForumOutlined />} onClick={() => dispatch(setIsSearch(true))}>Find a friend</Button>
              <Button variant="outlined" startIcon={<GroupAddOutlined />} onClick={() => dispatch(setIsNewGroup(true))}>Create a group</Button>
              <Button sx={{ display: { xs: "inline-flex", sm: "none" }, width: "100%" }} onClick={() => dispatch(setIsMobile(true))}>Browse your conversations</Button>
            </WorkspaceEmpty>
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
