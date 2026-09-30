"use client";

import { useInfiniteScrollTop } from "6pp";
import {
  AttachFile as AttachFileIcon,
  Send as SendIcon,
} from "@mui/icons-material";
import {
  Button,
  IconButton,
  Stack,
  Typography,
  Box,
  Drawer,
  Grid,
  Skeleton,
} from "@mui/material";
import {
  Fragment,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import dynamic from "next/dynamic";
import toast from "react-hot-toast";
import { shallowEqual, useDispatch, useSelector } from "react-redux";
import { useParams, useRouter } from "next/navigation";
import FileMenu from "../../../components/dialog/FileMenu";
import { FullPageLoader, TypingLoader } from "../../../components/layout/Loaders";
import MessageComponent from "../../../components/shared/MessageComponent";    
import { InputBox } from "../../../components/styles/StyledComponents";
import { grayColor, orange, gradientBg } from "../../../constants/color";
import {
  ALERT,
  CHAT_JOINED,
  CHAT_LEAVED,
  NEW_MESSAGE,
  NEW_MESSAGE_ALERT,
  NEW_REQUEST,
  ONLINE_USERS,
  REFETCH_CHATS,
  START_TYPING,
  STOP_TYPING,
} from "../../../constants/events";
import { useErrors, useSocketEvents } from "../../../hooks/useHooks";
import { getOrSaveFromStorage } from "../../../lib/features";
import {
  useGetChatDetailsQuery,
  useGetMessagesQuery,
  useGetMyChatsQuery,
} from "../../../redux/api/api";
import {
  incrementNotificationCount,
  removeNewMessagesAlert,
  setNewMessagesAlert,
} from "../../../redux/reducers/chat.reducer";
import {
  setIsDeleteMenu,
  setIsFileMenu,
  setIsMobile,
  setIsProfile,
  setSelectedDeleteChat,
} from "../../../redux/reducers/misc.reducer";
import { useSocket } from "../../../providers/SocketProvider";
import DeleteChatMenu from "../../../components/dialog/DeleteChatMenu";
import ProtectedRoute from "../../../components/auth/ProtectedRoute";

const Header = dynamic(() => import("../../../components/layout/Header"));
const ChatList = dynamic(() => import("../../../components/shared/ChatList"));
const Profile = dynamic(() => import("../../../components/shared/Profile"));
const MESSAGE_WINDOW_STEP = 120;

function ChatContent() {
  const params = useParams();
  const chatId = params?.chatId;

  const { user } = useSelector((state) => state.auth);
  const { uploadingLoader, isMobile, isProfile } = useSelector(
    (state) => ({
      uploadingLoader: state.misc.uploadingLoader,
      isMobile: state.misc.isMobile,
      isProfile: state.misc.isProfile,
    }),
    shallowEqual
  );
  const newMessagesAlert = useSelector((state) => state.chat.newMessagesAlert);

  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([]);
  const [page, setPage] = useState(1);
  const [fileMenuAnchor, setFileMenuAnchor] = useState(null);
  const [MeTyping, setMeTyping] = useState(false);
  const [userNameTyping, setUserNameTyping] = useState(null);
  const [onlineUsers, setOnlineUsers] = useState([]);

  const typingTimeout = useRef(null);
  const containerRef = useRef(null);
  const bottomRef = useRef(null);
  const inputRef = useRef(null);
  const deleteOptionAnchor = useRef(null);

  const [replyingTo, setReplyingTo] = useState(null);
  const [selectedChatId, setSelectedChatId] = useState(chatId);
  const [visibleMessageCount, setVisibleMessageCount] = useState(MESSAGE_WINDOW_STEP);
  const [stableChats, setStableChats] = useState([]);

  const router = useRouter();
  const dispatch = useDispatch();
  const socket = useSocket();

  const handleMobileClose = useCallback(() => {
    dispatch(setIsMobile(false));
  }, [dispatch]);

  const handleProfileClose = useCallback(() => {
    dispatch(setIsProfile(false));
  }, [dispatch]);

  const handleDeleteChat = useCallback((e, chatId, groupChat) => {
    e.preventDefault();
    deleteOptionAnchor.current = e.currentTarget;
    dispatch(setIsDeleteMenu(true));
    dispatch(setSelectedDeleteChat({ chatId, groupChat }));
  }, [dispatch]);

  const handleFileOpen = useCallback((e) => {
    dispatch(setIsFileMenu(true));
    setFileMenuAnchor(e.currentTarget);
  }, [dispatch]);

  const handleSelectChat = useCallback((nextChatId) => {
    if (nextChatId === selectedChatId) return;
    setSelectedChatId(nextChatId);
  }, [selectedChatId]);

  const {
    data: chatDetails,
    isLoading: isLoadingChatDetails,
    isError: isErrorChatDetails,
    error: errorChatDetails,
  } = useGetChatDetailsQuery({ chatId, populate: true }, { skip: !chatId });

  const {
    data: chatsData,
    isLoading: isLoadingChats,
    isError: isErrorChats,
    error: errorChats,
    refetch: refetchChats,
  } = useGetMyChatsQuery("", {
    refetchOnMountOrArgChange: false,
    refetchOnFocus: false,
    refetchOnReconnect: false,
  });

  const {
    data: oldMessagesChunks,
    isLoading: isLoadingMessages,
    isError: isErrorOldMessages,
    error: errorOldMessages,
  } = useGetMessagesQuery({ chatId, page }, { skip: !chatId });

  useErrors([
    { isError: isErrorChatDetails, error: errorChatDetails },
    { isError: isErrorOldMessages, error: errorOldMessages },
    { isError: isErrorChats, error: errorChats },
  ]);

  const { data: oldMessages, setData: setOldMessages } = useInfiniteScrollTop(
    containerRef,
    oldMessagesChunks?.totalPages,
    page,
    setPage,
    oldMessagesChunks?.messages
  );

  const allMessages = useMemo(() => [...oldMessages, ...messages], [oldMessages, messages]);
  const isChatWindowLoading = useMemo(
    () => isLoadingMessages && allMessages.length === 0,
    [isLoadingMessages, allMessages.length]
  );

  const chatMembers = useMemo(() => chatDetails?.chat?.members || [], [chatDetails?.chat?.members]);
  const members = useMemo(
    () => chatMembers.map((member) => member._id),
    [chatMembers]
  );

  const hasResolvedChats = useMemo(() => Array.isArray(chatsData?.chats), [chatsData?.chats]);
  const hasChatListData = useMemo(
    () => stableChats.length > 0,
    [stableChats.length]
  );
  const chatListData = useMemo(() => stableChats, [stableChats]);
  const chatListSkeleton = useMemo(
    () =>
      Array.from({ length: 8 }, (_, index) => (
        <Skeleton key={index} variant="rounded" height={95} />
      )),
    []
  );

  const displayedMessages = useMemo(
    () =>
      allMessages.length <= visibleMessageCount
        ? allMessages
        : allMessages.slice(-visibleMessageCount),
    [allMessages, visibleMessageCount]
  );
  const hiddenMessagesCount = useMemo(
    () => Math.max(allMessages.length - displayedMessages.length, 0),
    [allMessages.length, displayedMessages.length]
  );

  const messageChangeHandler = useCallback((e) => {
    setMessage(e.target.value);

    if (!socket || !socket.connected) return;

    if (!MeTyping && socket && socket.connected) {
      socket.emit(START_TYPING, {
        members,
        chatId,
        senderId: user._id,
      });
      setMeTyping(true);
    }

    if (typingTimeout.current) {
      clearTimeout(typingTimeout.current);
    }

    typingTimeout.current = setTimeout(() => {
      setMeTyping(false);
      if (socket && socket.connected) {
        socket.emit(STOP_TYPING, {
          members,
          chatId,
          senderId: user._id,
        });
      }
    }, 2000);
  }, [socket, MeTyping, members, chatId, user?._id]);

  const submitHandler = useCallback((e) => {
    e.preventDefault();
    if (!message.trim() || !socket || !socket.connected) return;
    if (!members || members.length === 0) return;

    const isSenderNameSameAsChatId = Boolean(
      replyingTo?.senderName &&
      chatId &&
      String(replyingTo.senderName).toLowerCase() === String(chatId).toLowerCase()
    );
    const replyTargetName = isSenderNameSameAsChatId
      ? "Anonymous"
      : (replyingTo?.senderName || "Anonymous");

    const formattedMessage = replyingTo
      ? `Reply to ${replyTargetName}: ${message.trim()}`
      : message;

    if (socket && socket.connected) {
      socket.emit(NEW_MESSAGE, {
        message: formattedMessage,
        chatId,
        members,
        replyTo: replyingTo
          ? {
              senderName: replyingTo.senderName,
              content: replyingTo.content,
            }
          : undefined,
      });
    }
    if (socket && socket.connected) {
      socket.emit(STOP_TYPING, {
        members,
        chatId,
        senderId: user._id,
      });
    }
    setMessage("");
    setReplyingTo(null);
  }, [message, socket, members, replyingTo, chatId, user?._id]);

  const handleReplyToMessage = useCallback((selectedMessage) => {
    setReplyingTo(selectedMessage);
    setMessage((prevMessage) => prevMessage || `@${selectedMessage.senderName} `);
    inputRef.current?.focus();
  }, []);

  const handleCancelReply = useCallback(() => {
    setReplyingTo(null);
    setMessage("");
  }, []);

  const renderedMessages = useMemo(
    () =>
      displayedMessages.map((msg) => (
        <MessageComponent
          message={msg}
          key={msg._id}
          onReply={handleReplyToMessage}
        />
      )),
    [displayedMessages, handleReplyToMessage]
  );

  const handleMessageListScroll = useCallback(
    (event) => {
      const scroller = event.currentTarget;
      const nearTop = scroller.scrollTop <= 120;

      if (nearTop && displayedMessages.length < allMessages.length) {
        setVisibleMessageCount((prev) =>
          Math.min(prev + MESSAGE_WINDOW_STEP, allMessages.length)
        );
      }
    },
    [displayedMessages.length, allMessages.length]
  );

  const alertHandler = useCallback(
    (data) => {
      if (data.chatId !== chatId) return;
      const messageForAlert = {
        content: data.message,
        sender: {
          _id: Date.now(),
          name: "System",
        },
        chat: chatId,
        createdAt: new Date().toISOString(),
      };

      setMessages((prevMessages) => [...prevMessages, messageForAlert]);
    },
    [chatId]
  );

  const newMessagesListener = useCallback(
    (data) => {
      if (data.chatId !== chatId) return;
      setMessages((prevMessages) => [...prevMessages, data.message]);
    },
    [chatId]
  );

  const startTypingListener = useCallback(
    (data) => {
      if (data.chatId !== chatId) return;
      const { senderId } = data;
      const member = chatMembers?.find((member) => member._id === senderId);
      if (member) {
        setUserNameTyping(member.name);
      }
    },
    [chatId, chatMembers]
  );

  const stopTypingListener = useCallback(
    (data) => {
      if (data.chatId !== chatId) return;
      const { senderId } = data;
      const member = chatMembers?.find((member) => member._id === senderId);
      if (member) {
        setUserNameTyping(null);
      }
    },
    [chatId, chatMembers]
  );

  const newMessagesAlertListener = useCallback(
    (data) => {
      if (data.chatId === chatId) return; // Ignore alerts for the current active chat
      dispatch(setNewMessagesAlert(data));
    },
    [dispatch, chatId]
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
    },
    [refetchChats]
  );

  const onlineUsersListener = useCallback((data) => {
    setOnlineUsers(data.onlineUsers);
  }, []);

  const eventHandler = useMemo(
    () => ({
      [ALERT]: alertHandler,
      [NEW_MESSAGE]: newMessagesListener,
      [START_TYPING]: startTypingListener,
      [STOP_TYPING]: stopTypingListener,
      [NEW_MESSAGE_ALERT]: newMessagesAlertListener,
      [NEW_REQUEST]: newRequestListener,
      [REFETCH_CHATS]: refetchChatsListener,
      [ONLINE_USERS]: onlineUsersListener,
    }),
    [
      alertHandler,
      newMessagesListener,
      startTypingListener,
      stopTypingListener,
      newMessagesAlertListener,
      newRequestListener,
      refetchChatsListener,
      onlineUsersListener,
    ]
  );

  useSocketEvents(socket, eventHandler);

  useEffect(() => {
    if (bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [allMessages]);

  useEffect(() => {
    if (!socket || !user) return;

    const joinChat = () => {
      socket.emit(CHAT_JOINED, {
        chatId,
        userId: user._id,
        members,
      });
    };

    if (socket.connected) {
      joinChat();
    } else {
      socket.once("connect", joinChat);
    }

    dispatch(removeNewMessagesAlert(chatId));

    return () => {
      setMessages([]);
      setPage(1);
      setOldMessages([]);
      setMessage("");
      socket.off("connect", joinChat);
      if (socket && socket.connected) {
        socket.emit(CHAT_LEAVED, {
          chatId,
          userId: user._id,
          members,
        });
      }
    };
  }, [chatId, socket, user, members, dispatch, setOldMessages]);

  useEffect(() => {
    if (isErrorOldMessages || isErrorChatDetails) {
      router.push("/");
    }
  }, [isErrorOldMessages, isErrorChatDetails, router]);

  useEffect(() => {
    getOrSaveFromStorage({
      key: NEW_MESSAGE_ALERT,
      value: newMessagesAlert,
    });
  }, [newMessagesAlert]);

  useEffect(() => {
    setSelectedChatId((prev) => (prev === chatId ? prev : chatId));
  }, [chatId]);

  useEffect(() => {
    if (Array.isArray(chatsData?.chats)) {
      setStableChats(chatsData.chats);
    }
  }, [chatsData?.chats]);

  useEffect(() => {
    setVisibleMessageCount(MESSAGE_WINDOW_STEP);
  }, [chatId]);

  return (
    <>
      <Header />
      <DeleteChatMenu deleteOptionAnchor={deleteOptionAnchor} />

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
        {isLoadingChats && !hasResolvedChats && !hasChatListData ? (
          <Stack spacing={"1rem"} sx={{ p: "1rem" }}>
            {chatListSkeleton}
          </Stack>
        ) : (
          <ChatList
            w="80vw"
            chats={chatListData}
            chatId={selectedChatId}
            newMessagesAlert={newMessagesAlert}
            onlineUsers={onlineUsers}
            handleDeleteChat={handleDeleteChat}
            onSelectChat={handleSelectChat}
          />
        )}
      </Drawer>

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

      <Grid container height={"calc(100vh - 4rem)"}>
        <Grid
          size={{ sm: 4, md: 5, lg: 3 }}
          sx={{
            display: { xs: "none", sm: "block" },
            background: gradientBg,
          }}
          height={"100%"}
        >
          {isLoadingChats && !hasResolvedChats && !hasChatListData ? (
            <Stack spacing={"1rem"}>
              {chatListSkeleton}
            </Stack>
          ) : (
            <ChatList
              chats={chatListData}
              chatId={selectedChatId}
              newMessagesAlert={newMessagesAlert}
              onlineUsers={onlineUsers}
              handleDeleteChat={handleDeleteChat}
              onSelectChat={handleSelectChat}
            />
          )}
        </Grid>

        <Grid size={{ sm: 8, md: 7, lg: 6, xs: 12 }} height={"100%"}>
          <Fragment>
            <Stack
              ref={containerRef}
              boxSizing="border-box"
              padding={"1rem"}
              spacing={"1rem"}
              bgcolor={grayColor}
              height={"90%"}
              sx={{
                overflowX: "hidden",
                overflowY: "auto",
                "&::-webkit-scrollbar": {
                  display: "none",
                },
              }}
              onScroll={handleMessageListScroll}
            >
              {isChatWindowLoading ? (
                <Stack
                  sx={{
                    width: "100%",
                    height: "100%",
                    justifyContent: "center",
                    alignItems: "center",
                  }}
                >
                  <FullPageLoader minHeight="100%" />
                </Stack>
              ) : allMessages.length === 0 ? (
                <Stack
                  sx={{
                    width: "100%",
                    height: "100%",
                    justifyContent: "center",
                    alignItems: "center",
                  }}
                  spacing={"1rem"}
                >
                  <Typography variant="h3" color="black">
                    No Messages Yet
                  </Typography>
                  <Typography variant="h5" color="black">
                    Start the conversation
                  </Typography>
                </Stack>
              ) : (
                <>
                  {hiddenMessagesCount > 0 && (
                    <Typography
                      variant="caption"
                      sx={{
                        display: "block",
                        textAlign: "center",
                        color: "#555",
                        mb: "0.25rem",
                      }}
                    >
                      Showing latest {displayedMessages.length} messages. Scroll up to load older loaded messages.
                    </Typography>
                  )}
                  {renderedMessages}
                </>
              )}
              {userNameTyping && <TypingLoader username={userNameTyping} />}
              <div ref={bottomRef} />
            </Stack>

            {replyingTo && (
              <Box
                sx={{
                  px: "1rem",
                  py: "0.4rem",
                  bgcolor: "#e3f2fd",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  gap: "1rem",
                }}
              >
                <Box sx={{ minWidth: 0 }}>
                  <Typography variant="body2" sx={{ color: "#0d47a1", fontWeight: 600 }}>
                    Replying to {replyingTo.senderName}
                  </Typography>
                  <Typography
                    variant="caption"
                    sx={{
                      color: "#0d47a1",
                      display: "block",
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      maxWidth: { xs: "180px", sm: "360px", md: "520px" },
                    }}
                  >
                    {replyingTo.content || "(no text message)"}
                  </Typography>
                </Box>
                <Button
                  size="small"
                  variant="text"
                  onClick={handleCancelReply}
                  sx={{ textTransform: "none" }}
                >
                  Cancel
                </Button>
              </Box>
            )}

            <form
              style={{
                height: "10%",
                background: "#00f2fe",
              }}
              onSubmit={submitHandler}
            >
              <Stack
                direction={"row"}
                height={"100%"}
                padding={"1rem"}
                alignItems={"center"}
              >
                <IconButton
                  onClick={handleFileOpen}
                  disabled={uploadingLoader}
                  sx={{
                    rotate: "30deg",
                    backgroundColor: orange,
                    marginRight: "1rem",
                    color: "white",
                  }}
                >
                  <AttachFileIcon />
                </IconButton>

                <InputBox
                  placeholder="Type a message..."
                  value={message}
                  onChange={messageChangeHandler}
                  ref={inputRef}
                  sx={{
                    padding: "1rem",
                    borderRadius: "250px",
                    backgroundColor: "white",
                    boxShadow: "0px 2px 10px rgba(0, 0, 0, 0.1)",
                  }}
                />

                <IconButton
                  type="submit"
                  sx={{
                    rotate: "-30deg",
                    backgroundColor: orange,
                    color: "white",
                    marginLeft: "1rem",
                    padding: "0.4rem",
                    "&:hover": {
                      bgcolor: "error.dark",
                    },
                  }}
                >
                  <SendIcon />
                </IconButton>
              </Stack>
            </form>

            <FileMenu anchorE1={fileMenuAnchor} chatId={chatId} />
          </Fragment>
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

export default function Chat() {
  return (
    <ProtectedRoute>
      <ChatContent />
    </ProtectedRoute>
  );
}
