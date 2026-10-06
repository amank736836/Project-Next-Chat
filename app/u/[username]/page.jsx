"use client";

import {
  Alert,
  Avatar,
  Box,
  Button,
  Chip,
  CircularProgress,
  Drawer,
  MenuItem,
  Skeleton,
  Paper,
  Tab,
  Tabs,
  Pagination,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import axios from "axios";
import Link from "next/link";
import Brand from "../../../components/shared/Brand";
import {
  ArrowBackRounded,
  ArrowForwardRounded,
  AutoAwesomeOutlined,
  ChatBubbleOutlineRounded,
  CodeRounded,
  ContentCopyRounded,
  EditNoteRounded,
  ForumOutlined,
  PublicRounded,
  RefreshRounded,
  SendRounded,
  VisibilityOutlined,
  VisibilityOffOutlined,
} from "@mui/icons-material";
import {
  BoardSection,
  BoardEmpty,
  boardSurfaceSx,
} from "../../../components/board/BoardSurface";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import toast from "react-hot-toast";
import { useDispatch, useSelector } from "react-redux";
import { useParams } from "next/navigation";
import { useTheme } from "@mui/material/styles";
import useMediaQuery from "@mui/material/useMediaQuery";
import { nextBackend, socketBackend } from "../../../constants/config";
import Header from "../../../components/layout/Header";
import ChatList from "../../../components/shared/ChatList";
import Profile from "../../../components/shared/Profile";
import DeleteChatMenu from "../../../components/dialog/DeleteChatMenu";
import EmbedSetupPanel from "../../../components/widget/EmbedSetupPanel";
import { useGetMyChatsQuery } from "../../../redux/api/api";
import { userExists } from "../../../redux/reducers/auth.reducer";
import { setNotificationCount } from "../../../redux/reducers/chat.reducer";
import {
  setIsDeleteMenu,
  setIsMobile,
  setIsProfile,
  setSelectedDeleteChat,
} from "../../../redux/reducers/misc.reducer";
import { useSocket } from "../../../providers/SocketProvider";

const NEXT_QUESTIONS_API_BASE = `${nextBackend}/chat/questions`;
const ASK_AND_RECORD_API_BASE = `${socketBackend || nextBackend}/chat/ask-and-record`;

const specialChar = "||";

const parseStringMessages = (messageString) => {
  return messageString
    .split(specialChar)
    .map((msg) => msg.trim())
    .filter(Boolean);
};

const initialMessageString =
  "What's your favorite movie?||Do you have any pets?||What's your dream job?";
const ANSWER_SHOWCASE_PAGE_SIZE = 4;

export default function Username() {
  const params = useParams();
  const username = params.username;
  const theme = useTheme();
  const isMobileView = useMediaQuery(theme.breakpoints.down("sm"));
  const dispatch = useDispatch();
  const deleteOptionAnchor = useRef(null);
  const messageInputRef = useRef(null);
  const questionsRequestId = useRef(0);
  const [viewerLoading, setViewerLoading] = useState(true);

  const { user } = useSelector((state) => state.auth);
  const { isMobile, isProfile } = useSelector((state) => state.misc);
  const [viewerUsername, setViewerUsername] = useState("");
  const [viewerUser, setViewerUser] = useState(null);

  const normalizedUsername = (username || "").toLowerCase();
  const normalizedUserUsername = (user?.username || "").toLowerCase();
  const normalizedViewerUsername = (viewerUsername || "").toLowerCase();
  const isLoggedInViewer = Boolean(
    normalizedUserUsername || normalizedViewerUsername,
  );
  const isOwner = Boolean(
    normalizedUsername &&
    (normalizedUserUsername === normalizedUsername ||
      normalizedViewerUsername === normalizedUsername),
  );

  const [content, setContent] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [messageString, setMessageString] = useState(initialMessageString);
  const [messageArray, setMessageArray] = useState([]);
  const [isCompletionLoading, setIsCompletionLoading] = useState(false);
  const [completionError, setCompletionError] = useState(null);
  const [answeredShowcase, setAnsweredShowcase] = useState([]);
  const [customQuestions, setCustomQuestions] = useState([]);
  const [priorityQuestions, setPriorityQuestions] = useState([]);
  const [newQuestion, setNewQuestion] = useState("");
  const [selectedSuggestionTemplate, setSelectedSuggestionTemplate] =
    useState("");
  const [savingQuestionId, setSavingQuestionId] = useState(null);
  const [deletingQuestionId, setDeletingQuestionId] = useState(null);
  const [hidingShowcaseId, setHidingShowcaseId] = useState(null);
  const [mobileTab, setMobileTab] = useState("board");
  const [ownerTab, setOwnerTab] = useState("board");
  const [hostFilter, setHostFilter] = useState("");
  const [availableHosts, setAvailableHosts] = useState([]);

  const mergeAvailableHosts = useCallback((hosts) => {
    if (!Array.isArray(hosts)) return;
    setAvailableHosts((prev) => [...new Set([...prev, ...hosts])]);
  }, []);
  const [answerShowcasePage, setAnswerShowcasePage] = useState(1);
  const hasAnsweredShowcase = answeredShowcase.length > 0;
  const totalAnswerShowcasePages = Math.max(
    Math.ceil(answeredShowcase.length / ANSWER_SHOWCASE_PAGE_SIZE),
    1,
  );
  const pagedAnsweredShowcase = useMemo(() => {
    const startIndex = (answerShowcasePage - 1) * ANSWER_SHOWCASE_PAGE_SIZE;
    return answeredShowcase.slice(
      startIndex,
      startIndex + ANSWER_SHOWCASE_PAGE_SIZE,
    );
  }, [answerShowcasePage, answeredShowcase]);
  const isSelectedSuggestionUnedited =
    Boolean(selectedSuggestionTemplate.trim()) &&
    newQuestion.trim() === selectedSuggestionTemplate.trim();
  const canSaveCustomQuestion =
    Boolean(newQuestion.trim()) &&
    savingQuestionId !== "new" &&
    !isSelectedSuggestionUnedited;

  const { data: chatsData, isLoading: isLoadingChats } = useGetMyChatsQuery(
    "",
    {
      skip: !isLoggedInViewer,
    },
  );

  const chatListData = useMemo(
    () => chatsData?.chats || [],
    [chatsData?.chats],
  );

  const handleMobileClose = useCallback(() => {
    dispatch(setIsMobile(false));
  }, [dispatch]);

  const handleProfileClose = useCallback(() => {
    dispatch(setIsProfile(false));
  }, [dispatch]);

  const handleDeleteChat = useCallback(
    (e, chatId, groupChat) => {
      e.preventDefault();
      deleteOptionAnchor.current = e.currentTarget;
      dispatch(setIsDeleteMenu(true));
      dispatch(setSelectedDeleteChat({ chatId, groupChat }));
    },
    [dispatch],
  );

  useEffect(() => {
    let isMounted = true;

    const fetchViewer = async () => {
      try {
        const { data } = await axios.get(`${nextBackend}/user/me`, {
          withCredentials: true,
        });

        if (isMounted) {
          setViewerUser(data?.user || null);
          setViewerUsername(data?.user?.username || "");
          if (data?.user) {
            dispatch(userExists(data.user));
            dispatch(setNotificationCount(data.notificationCount || 0));
          }
        }
      } catch {
        if (isMounted) {
          setViewerUser(null);
          setViewerUsername("");
        }
      } finally {
        if (isMounted) setViewerLoading(false);
      }
    };

    fetchViewer();

    return () => {
      isMounted = false;
    };
  }, [dispatch]);

  const fetchSuggestedMessages = useCallback(
    async ({ refresh = false, exclude = "" } = {}) => {
      const requestId = ++questionsRequestId.current;
      setIsCompletionLoading(true);
      try {
        const response = await axios.get(NEXT_QUESTIONS_API_BASE, {
          params: {
            username,
            exclude,
            refresh,
            ...(hostFilter ? { host: hostFilter } : {}),
          },
        });

        if (requestId !== questionsRequestId.current) return;
        if (response.data.success) {
          const nextSuggestions = (response.data.suggestions || []).join(
            specialChar,
          );
          setMessageString(nextSuggestions);
          setAnsweredShowcase(response.data.answered || []);
          setCustomQuestions(response.data.customQuestions || []);
          setPriorityQuestions(response.data.priorityQuestions || []);
          mergeAvailableHosts(response.data.availableHosts);

          setCompletionError(null);
        } else {
          setMessageString(initialMessageString);
          setCompletionError(new Error("Unable to load board questions."));
          toast.error("Failed to fetch suggested messages. Please try again.");
        }
      } catch (error) {
        if (requestId !== questionsRequestId.current) return;
        console.error(error);
        toast.error("Failed to fetch suggested messages. Please try again.");
        setCompletionError(error);
      } finally {
        if (requestId === questionsRequestId.current)
          setIsCompletionLoading(false);
      }
    },
    [username, hostFilter, mergeAvailableHosts],
  );

  const saveQuestion = async ({ questionId = null, question }) => {
    if (!isOwner || !question.trim() || savingQuestionId) return;
    setSavingQuestionId(questionId || "new");
    try {
      const response = await axios.put(NEXT_QUESTIONS_API_BASE, {
        username,
        questionId,
        question: question.trim(),
      });

      if (response.data.success) {
        toast.success("Question saved successfully");
        setNewQuestion("");
        setSelectedSuggestionTemplate("");
        fetchSuggestedMessages({ exclude: messageString });
      } else {
        toast.error("Failed to save question");
      }
    } catch (error) {
      toast.error("Failed to save question");
    } finally {
      setSavingQuestionId(null);
    }
  };

  const deleteCustomQuestion = async (questionId) => {
    if (!questionId || !isOwner) return;

    setDeletingQuestionId(questionId);
    try {
      const response = await axios.delete(NEXT_QUESTIONS_API_BASE, {
        data: {
          username,
          questionId,
        },
      });

      if (response.data.success) {
        toast.success("Question deleted successfully");
        setCustomQuestions((prev) =>
          prev.filter((item) => item.id !== questionId),
        );
        await fetchSuggestedMessages({ refresh: false, exclude: "" });
      } else {
        toast.error("Failed to delete question");
      }
    } catch (error) {
      toast.error("Failed to delete question");
    } finally {
      setDeletingQuestionId(null);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!content.trim()) return;

    if (isOwner) {
      toast.error("Owner cannot ask questions on own board.");
      return;
    }

    setIsLoading(true);
    try {
      const askedQuestion = content.trim();
      const senderPayload = user?._id
        ? {
            _id: user._id,
            name: user.name,
            username: user.username,
          }
        : viewerUser?._id
          ? {
              _id: viewerUser._id,
              name: viewerUser.name,
              username: viewerUser.username,
            }
          : null;

      const response = await axios.post(
        ASK_AND_RECORD_API_BASE,
        {
          username,
          question: askedQuestion,
          content: askedQuestion,
          sender: senderPayload,
        },
        {
          withCredentials: true,
        },
      );

      if (
        response.data.success &&
        response.data.alreadyAsked &&
        !response.data.alreadyAnswered
      ) {
        toast("This question was already asked. Please ask a different one.");
        await fetchSuggestedMessages({
          refresh: false,
          exclude: askedQuestion,
        });
        setContent("");
        return;
      }

      if (response.data.success && response.data.alreadyAnswered) {
        toast.success(
          "This question is already answered. Showing existing answer.",
        );
        setAnsweredShowcase((prev) => {
          const exists = prev.some(
            (item) =>
              item.question.toLowerCase() ===
              response.data.answeredQuestion.toLowerCase(),
          );
          if (exists) return prev;
          return [
            {
              id: `local-${Date.now()}`,
              question: response.data.answeredQuestion,
              answer: response.data.answeredAnswer,
            },
            ...prev,
          ];
        });
        setContent("");
        return;
      }

      if (response.data.success && response.data.messageSent) {
        if (response.data.realtimeDelivered) {
          toast.success("Message delivered in real-time! 🎉");
        } else {
          toast.success("Message saved. They'll see it when they come online.");
        }
        setContent("");
        await fetchSuggestedMessages({
          refresh: true,
          exclude: `${messageString}${specialChar}${askedQuestion}`,
        });
      } else if (response.data.success && !response.data.alreadyAnswered) {
        // Message was saved to DB even if socket delivery had issues
        toast.success("Message saved successfully.");
        setContent("");
        await fetchSuggestedMessages({
          refresh: true,
          exclude: `${messageString}${specialChar}${askedQuestion}`,
        });
      } else {
        toast.error("Failed to send message. Please try again.");
      }
    } catch (error) {
      console.error(error);
      toast.error("Failed to send message. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    setMessageArray(parseStringMessages(messageString));
  }, [messageString]);

  useEffect(() => {
    if (!username) return;
    fetchSuggestedMessages({ refresh: false, exclude: "" });
    return () => {
      questionsRequestId.current += 1;
    };
  }, [username, fetchSuggestedMessages]);

  useEffect(() => {
    if (!hasAnsweredShowcase && mobileTab === "showcase") {
      setMobileTab("board");
    }
  }, [hasAnsweredShowcase, mobileTab]);

  useEffect(() => {
    setAnswerShowcasePage((currentPage) =>
      Math.min(currentPage, totalAnswerShowcasePages),
    );
  }, [totalAnswerShowcasePages]);

  const socket = useSocket();

  useEffect(() => {
    if (!socket || !isOwner) return;

    const handleQuestionAsked = (data) => {
      const { questionId, question, askedCount, normalizedQuestion } = data;

      setPriorityQuestions((prev) => {
        // Check if question already exists in priority list
        const existingIndex = prev.findIndex((q) => q.id === questionId);

        if (existingIndex !== -1) {
          // Update existing question's ask count
          const updated = [...prev];
          updated[existingIndex] = {
            ...updated[existingIndex],
            askedCount,
          };
          // Re-sort by askedCount descending
          return updated.sort(
            (a, b) => (b.askedCount || 0) - (a.askedCount || 0),
          );
        } else {
          // Add new priority question
          return [
            ...prev,
            {
              id: questionId,
              question,
              askedCount,
              normalizedQuestion,
            },
          ].sort((a, b) => (b.askedCount || 0) - (a.askedCount || 0));
        }
      });
    };

    socket.on("QUESTION_ASKED", handleQuestionAsked);

    return () => {
      socket.off("QUESTION_ASKED", handleQuestionAsked);
    };
  }, [socket, isOwner]);

  const handleMessageClick = (msg) => {
    if (isOwner) return;
    setContent(msg);
    messageInputRef.current?.focus();
  };

  const handleSuggestionTemplateClick = (msg) => {
    if (!isOwner) return;
    setNewQuestion(msg);
    setSelectedSuggestionTemplate(msg);
    setOwnerTab("questions");
  };

  const suggestionVisibleCount = isMobileView ? 3 : 4;

  const hostFilterControl = availableHosts.length > 0 && (
    <TextField
      select
      size="small"
      label="Website"
      value={hostFilter}
      onChange={(e) => {
        setHostFilter(e.target.value);
        setAnswerShowcasePage(1);
      }}
      sx={{ minWidth: 160 }}
    >
      <MenuItem value="">All websites</MenuItem>
      {availableHosts.map((host) => (
        <MenuItem key={host} value={host}>
          {host}
        </MenuItem>
      ))}
    </TextField>
  );

  const toggleShowcaseVisibility = async (item) => {
    if (!isOwner || !item?.id || !item?.itemType) return;

    setHidingShowcaseId(item.id);
    try {
      const isHidden = Boolean(item.hiddenFromShowcase);
      const response = await axios.patch(NEXT_QUESTIONS_API_BASE, {
        username,
        itemId: item.id,
        itemType: item.itemType,
        action: isHidden ? "show" : "hide",
      });

      if (response.data.success) {
        setAnsweredShowcase((prev) =>
          prev.map((entry) =>
            entry.id === item.id
              ? { ...entry, hiddenFromShowcase: !isHidden }
              : entry,
          ),
        );
        toast.success(
          isHidden ? "Showcase item shown" : "Showcase item hidden",
        );
      } else {
        toast.error(
          isHidden
            ? "Failed to show showcase item"
            : "Failed to hide showcase item",
        );
      }
    } catch (error) {
      console.error(error);
      toast.error("Failed to update showcase item");
    } finally {
      setHidingShowcaseId(null);
    }
  };

  const copyBoardLink = async () => {
    try {
      await navigator.clipboard.writeText(
        `${window.location.origin}/u/${encodeURIComponent(username)}`,
      );
      toast.success("Board link copied");
    } catch {
      toast.error(
        "Could not copy the link. You can copy it from your browser's address bar.",
      );
    }
  };

  const suggestionsBlock = (
    <BoardSection
      title={isOwner ? "Conversation starters" : "Need a little inspiration?"}
      description={
        isOwner
          ? "Give visitors a starting point. Choose a suggestion to make it your own."
          : "Choose a prompt below, or write something that's on your mind."
      }
      action={
        <Button
          aria-label="Refresh suggestions"
          size="small"
          onClick={() =>
            fetchSuggestedMessages({ refresh: true, exclude: messageString })
          }
          disabled={isCompletionLoading}
          sx={{ minWidth: 36, p: 1 }}
        >
          <RefreshRounded />
        </Button>
      }
    >
      {isCompletionLoading ? (
        <Stack spacing={1} aria-label="Loading suggestions">
          {[1, 2, 3].map((key) => (
            <Skeleton key={key} variant="rounded" height={56} />
          ))}
        </Stack>
      ) : messageArray.length ? (
        <Stack spacing={1}>
          {messageArray.slice(0, suggestionVisibleCount).map((msg) => (
            <Button
              key={msg}
              className="board-prompt"
              fullWidth
              onClick={() =>
                isOwner
                  ? handleSuggestionTemplateClick(msg)
                  : handleMessageClick(msg)
              }
              sx={{
                justifyContent: "space-between",
                textAlign: "left",
                gap: 2,
                p: 2,
                border: "1px solid var(--champ-border)",
                bgcolor: "var(--champ-field)",
                color: "text.primary",
                fontWeight: 500,
                fontSize: 14,
              }}
              endIcon={
                <ArrowForwardRounded
                  sx={{ color: "primary.main", fontSize: "18px !important" }}
                />
              }
            >
              {msg}
            </Button>
          ))}
        </Stack>
      ) : (
        <BoardEmpty
          icon={AutoAwesomeOutlined}
          title="A fresh start"
          description="No suggestions available right now. Refresh to try again."
        />
      )}
    </BoardSection>
  );

  const questionsPanel = (
    <Stack spacing={3}>
      <BoardSection
        title="Make room for curiosity"
        description="Create a question you'd like visitors to ask you."
      >
        <Stack
          component="form"
          spacing={2}
          onSubmit={(event) => {
            event.preventDefault();
            if (canSaveCustomQuestion) saveQuestion({ question: newQuestion });
          }}
        >
          <TextField
            fullWidth
            label="Your question"
            placeholder="What's something you'd love to talk about?"
            value={newQuestion}
            onChange={(e) => setNewQuestion(e.target.value)}
          />
          {isSelectedSuggestionUnedited && (
            <Typography variant="caption" color="text.secondary">
              Edit the selected suggestion before saving.
            </Typography>
          )}
          <Button
            type="submit"
            variant="contained"
            startIcon={<EditNoteRounded />}
            disabled={!canSaveCustomQuestion}
            sx={{ alignSelf: "flex-start" }}
          >
            {savingQuestionId === "new"
              ? "Saving question…"
              : "Save custom question"}
          </Button>
        </Stack>
      </BoardSection>
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "1fr", lg: "1fr 1fr" },
          gap: 3,
          alignItems: "start",
        }}
      >
        <BoardSection
          title="Your custom questions"
          description={`${customQuestions.length} conversation ${customQuestions.length === 1 ? "starter" : "starters"} created by you`}
        >
          {customQuestions.length ? (
            <Stack spacing={1.5}>
              {customQuestions.map((item) => (
                <Stack
                  key={item.id}
                  direction="row"
                  alignItems="center"
                  gap={1}
                  sx={{ p: 2, border: "1px solid var(--champ-border)", borderRadius: 2 }}
                >
                  <Typography
                    variant="body2"
                    sx={{ flex: 1, overflowWrap: "anywhere" }}
                  >
                    {item.question}
                  </Typography>
                  <Button
                    size="small"
                    color="error"
                    aria-label={`Delete question: ${item.question}`}
                    onClick={() => deleteCustomQuestion(item.id)}
                    disabled={deletingQuestionId === item.id}
                  >
                    {deletingQuestionId === item.id ? "Deleting…" : "Delete"}
                  </Button>
                </Stack>
              ))}
            </Stack>
          ) : (
            <BoardEmpty
              icon={EditNoteRounded}
              title="Your first question starts here"
              description="Add a question above to give your board a personal touch."
            />
          )}
        </BoardSection>
        <BoardSection
          title="Most asked"
          description="See what's sparking your visitors' curiosity."
        >
          {priorityQuestions.length ? (
            <Stack spacing={1.5}>
              {priorityQuestions.map((item, index) => (
                <Stack
                  key={item.id}
                  direction="row"
                  alignItems="center"
                  gap={1.5}
                  sx={{ p: 2, bgcolor: "var(--champ-field)", borderRadius: 2 }}
                >
                  <Typography
                    variant="caption"
                    color="primary"
                    fontWeight={700}
                  >
                    {String(index + 1).padStart(2, "0")}
                  </Typography>
                  <Typography
                    variant="body2"
                    sx={{ flex: 1, overflowWrap: "anywhere" }}
                  >
                    {item.question}
                  </Typography>
                  <Chip
                    size="small"
                    label={`${item.askedCount} asks`}
                    sx={{
                      bgcolor: "var(--champ-soft)",
                      color: "primary.main",
                      fontSize: 11,
                    }}
                  />
                </Stack>
              ))}
            </Stack>
          ) : (
            <BoardEmpty
              icon={ForumOutlined}
              title="Curiosity is on its way"
              description="Questions your visitors ask will appear here."
            />
          )}
        </BoardSection>
      </Box>
    </Stack>
  );

  const ownerBoardPanel = (
    <Box
      sx={{
        display: "grid",
        gridTemplateColumns: {
          xs: "1fr",
          md: "minmax(0, 1.6fr) minmax(0, 1fr)",
        },
        gap: 3,
        alignItems: "start",
      }}
    >
      {suggestionsBlock}
      <Stack spacing={3}>
        <BoardSection
          title="Your board, out in the world"
          description="Share your link and invite a little curiosity."
        >
          <Box
            sx={{
              p: 1.5,
              bgcolor: "var(--champ-canvas)",
              border: "1px dashed var(--champ-border)",
              borderRadius: 2,
              mb: 2,
            }}
          >
            <Typography variant="body2" sx={{ overflowWrap: "anywhere" }}>
              /u/{username}
            </Typography>
          </Box>
          <Button
            variant="outlined"
            fullWidth
            startIcon={<ContentCopyRounded />}
            onClick={copyBoardLink}
          >
            Copy board link
          </Button>
        </BoardSection>
        <Box sx={{ ...boardSurfaceSx, p: 3, bgcolor: "var(--champ-soft)" }}>
          <PublicRounded sx={{ color: "var(--champ-primary)", mb: 1 }} />
          <Typography component="h2" fontWeight={700} sx={{ mb: 1 }}>
            Make it part of your website
          </Typography>
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{ lineHeight: 1.8, mb: 2 }}
          >
            Add a message widget to your site. Bring every conversation back to
            one place.
          </Typography>
          <Button
            onClick={() => setOwnerTab("embed")}
            endIcon={<ArrowForwardRounded />}
            sx={{ p: 0, color: "var(--champ-primary-hover)" }}
          >
            Set up your widget
          </Button>
        </Box>
      </Stack>
    </Box>
  );

  const boardPanel = (
    <Stack spacing={3}>
      <BoardSection
        title="What's on your mind?"
        description={`Leave a question or a thoughtful note for @${username}.`}
      >
        <Stack component="form" onSubmit={handleSubmit} spacing={2}>
          <TextField
            fullWidth
            multiline
            minRows={5}
            label="Your message"
            inputRef={messageInputRef}
            placeholder="A question, a kind thought, a little curiosity…"
            value={content}
            onChange={(e) => setContent(e.target.value)}
          />
          <Stack
            direction="row"
            alignItems="center"
            justifyContent="space-between"
            gap={2}
          >
            <Typography variant="caption" color="text.secondary">
              A little kindness goes a long way.
            </Typography>
            <Button
              type="submit"
              variant="contained"
              startIcon={
                isLoading ? (
                  <CircularProgress size={16} color="inherit" />
                ) : (
                  <SendRounded />
                )
              }
              disabled={isLoading || !content.trim()}
              sx={{ flexShrink: 0 }}
            >
              {isLoading ? "Sending…" : "Send message"}
            </Button>
          </Stack>
        </Stack>
      </BoardSection>
      {suggestionsBlock}
      {!isLoggedInViewer && (
        <Stack alignItems="center" spacing={1}>
          <Typography variant="body2" color="text.secondary">
            A space like this could be yours, too.
          </Typography>
          <Button
            component={Link}
            href="/login"
            endIcon={<ArrowForwardRounded />}
          >
            Create your own board
          </Button>
        </Stack>
      )}
    </Stack>
  );

  const answerShowcasePanel = (
    <BoardSection
      title="Answer showcase"
      description={
        isOwner
          ? "The conversations you choose to share with the world."
          : `A little more about @${username}, in their own words.`
      }
    >
      {isCompletionLoading ? (
        <Skeleton variant="rounded" height={180} />
      ) : pagedAnsweredShowcase.length ? (
        <Stack spacing={2}>
          {pagedAnsweredShowcase.map((item) => (
            <Box
              key={item.id}
              sx={{
                border: "1px solid var(--champ-border)",
                borderRadius: 3,
                p: 2.5,
                bgcolor: item.hiddenFromShowcase ? "var(--champ-field)" : "white",
              }}
            >
              <Stack
                direction="row"
                alignItems="center"
                justifyContent="space-between"
                gap={1}
                sx={{ mb: 1.5 }}
              >
                <Typography
                  variant="overline"
                  color="primary"
                  sx={{ letterSpacing: ".1em", fontSize: 10 }}
                >
                  A LITTLE CURIOSITY
                </Typography>
                {isOwner && item.itemType && (
                  <Button
                    size="small"
                    startIcon={
                      item.hiddenFromShowcase ? (
                        <VisibilityOutlined />
                      ) : (
                        <VisibilityOffOutlined />
                      )
                    }
                    onClick={() => toggleShowcaseVisibility(item)}
                    disabled={hidingShowcaseId === item.id}
                    aria-label={`${item.hiddenFromShowcase ? "Show" : "Hide"} answer: ${item.question}`}
                    sx={{ p: 0.5, flexShrink: 0 }}
                  >
                    {hidingShowcaseId === item.id
                      ? "Updating…"
                      : item.hiddenFromShowcase
                        ? "Show"
                        : "Hide"}
                  </Button>
                )}
              </Stack>
              <Typography fontWeight={650} sx={{ overflowWrap: "anywhere" }}>
                {item.question}
              </Typography>
              <Typography
                variant="body2"
                color="text.secondary"
                sx={{
                  mt: 2,
                  pl: 2,
                  borderLeft: "3px solid var(--champ-mint-strong)",
                  lineHeight: 1.8,
                  whiteSpace: "pre-wrap",
                  overflowWrap: "anywhere",
                }}
              >
                {item.answer}
              </Typography>
              {isOwner && item.hiddenFromShowcase && (
                <Chip
                  size="small"
                  label="Hidden from public showcase"
                  sx={{
                    mt: 2,
                    bgcolor: "var(--champ-soft)",
                    color: "text.secondary",
                    fontSize: 11,
                  }}
                />
              )}
            </Box>
          ))}
        </Stack>
      ) : (
        <BoardEmpty
          icon={ChatBubbleOutlineRounded}
          title="Every answer starts with a question"
          description={
            isOwner
              ? "Your answered public questions will find a home here."
              : "No answers shared yet. Start a conversation with a question."
          }
        />
      )}
      {answeredShowcase.length > ANSWER_SHOWCASE_PAGE_SIZE && (
        <Stack alignItems="center" sx={{ mt: 3 }}>
          <Pagination
            count={totalAnswerShowcasePages}
            page={answerShowcasePage}
            onChange={(_, page) => setAnswerShowcasePage(page)}
            color="primary"
            shape="rounded"
            size={isMobileView ? "small" : "medium"}
          />
        </Stack>
      )}
    </BoardSection>
  );

  const ownerTabs = [
    { value: "board", label: "Overview", icon: <PublicRounded /> },
    { value: "questions", label: "Questions", icon: <EditNoteRounded /> },
    {
      value: "showcase",
      label: "Showcase",
      icon: <ChatBubbleOutlineRounded />,
    },
    { value: "embed", label: "Embed", icon: <CodeRounded /> },
  ];

  if (viewerLoading)
    return (
      <Box
        className="workspace-root"
        sx={{ minHeight: "100dvh", p: { xs: 3, md: 6 } }}
      >
        <Stack
          spacing={3}
          sx={{ maxWidth: 1120, mx: "auto" }}
          role="status"
          aria-label="Loading board"
        >
          <Skeleton variant="rounded" height={210} />
          <Skeleton variant="rounded" height={56} />
          <Skeleton variant="rounded" height={300} />
        </Stack>
      </Box>
    );

  return (
    <Box
      className="workspace-root board-workspace"
      sx={{ minHeight: "100dvh" }}
    >
      {isLoggedInViewer ? (
        <Header alwaysShowProfile />
      ) : (
        <Stack
          component="header"
          direction="row"
          alignItems="center"
          justifyContent="space-between"
          sx={{
            bgcolor: "white",
            px: { xs: 2, sm: 4 },
            py: 2,
            borderBottom: "1px solid var(--champ-border)",
          }}
        >
          <Button
            component={Link}
            href="/login"
            sx={{ color: "text.primary", p: 0, fontSize: 18, fontWeight: 750 }}
          >
            <Brand />
          </Button>
          <Button
            component={Link}
            href="/login"
            size="small"
            variant="outlined"
          >
            Get your own board
          </Button>
        </Stack>
      )}
      {isLoggedInViewer && (
        <>
          <DeleteChatMenu deleteOptionAnchor={deleteOptionAnchor} />
          <Drawer
            open={isMobile}
            onClose={handleMobileClose}
            anchor="right"
            slotProps={{ paper: { sx: { width: "min(85vw, 360px)" } } }}
          >
            {isLoadingChats ? (
              <Stack sx={{ p: 2 }} spacing={2}>
                {[1, 2, 3].map((key) => (
                  <Skeleton key={key} variant="rounded" height={80} />
                ))}
              </Stack>
            ) : (
              <ChatList
                chats={chatListData}
                handleDeleteChat={handleDeleteChat}
                onSelectChat={handleMobileClose}
              />
            )}
          </Drawer>
          <Drawer
            open={isProfile}
            onClose={handleProfileClose}
            anchor="right"
            slotProps={{ paper: { sx: { width: "min(85vw, 360px)" } } }}
          >
            <Profile />
          </Drawer>
        </>
      )}
      <Box
        component="main"
        sx={{ maxWidth: 1200, mx: "auto", p: { xs: 2, sm: 3, md: 5 } }}
      >
        <Stack
          direction="row"
          alignItems="center"
          justifyContent="space-between"
          sx={{ mb: 3 }}
        >
          {isLoggedInViewer ? (
            <Button
              component={Link}
              href="/"
              color="inherit"
              startIcon={<ArrowBackRounded />}
              sx={{ p: 0 }}
            >
              Messages
            </Button>
          ) : (
            <Typography
              variant="overline"
              color="text.secondary"
              sx={{ letterSpacing: ".12em" }}
            >
              A SPACE FOR CONNECTION
            </Typography>
          )}
          <Chip
            icon={<PublicRounded />}
            label={isOwner ? "Your message board" : "Message board"}
            size="small"
            sx={{ bgcolor: "var(--champ-soft)", color: "primary.main", fontSize: 11 }}
          />
        </Stack>
        <Paper
          component="section"
          elevation={0}
          className="workspace-reveal"
          sx={{
            ...boardSurfaceSx,
            p: { xs: 3, sm: 4 },
            mb: 3,
            position: "relative",
            overflow: "hidden",
            background: "linear-gradient(115deg, #fff 35%, var(--champ-soft))",
          }}
        >
          <Box className="board-hero-orbit" aria-hidden="true" />
          <Stack
            direction={{ xs: "column", sm: "row" }}
            alignItems={{ xs: "flex-start", sm: "center" }}
            gap={3}
            sx={{ position: "relative" }}
          >
            <Avatar
              src={
                isOwner
                  ? viewerUser?.avatar?.url || user?.avatar?.url
                  : undefined
              }
              sx={{
                width: 68,
                height: 68,
                borderRadius: "20px",
                bgcolor: "var(--champ-primary)",
                color: "white",
                boxShadow: "0 8px 24px color-mix(in srgb, var(--champ-primary) 14.51%, transparent)",
              }}
            >
              {isOwner ? (
                <PublicRounded fontSize="large" />
              ) : (
                <ChatBubbleOutlineRounded fontSize="large" />
              )}
            </Avatar>
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography
                variant="overline"
                color="primary"
                sx={{ letterSpacing: ".16em", fontSize: 10 }}
              >
                {isOwner
                  ? "YOUR LITTLE CORNER OF THE INTERNET"
                  : "SAY SOMETHING THAT MATTERS"}
              </Typography>
              <Typography
                component="h1"
                variant="h4"
                sx={{
                  mt: 0.5,
                  fontSize: { xs: 28, sm: 36 },
                  overflowWrap: "anywhere",
                }}
              >
                {isOwner
                  ? "Let the conversation find you."
                  : `A note for @${username}`}
              </Typography>
              <Typography
                variant="body2"
                color="text.secondary"
                sx={{ mt: 1, lineHeight: 1.8 }}
              >
                {isOwner
                  ? `@${username} · Share your link, spark a question, and connect on your terms.`
                  : "A question you've been meaning to ask. A thought worth sharing. Start here."}
              </Typography>
            </Box>
            {isOwner && (
              <Button
                variant="contained"
                startIcon={<ContentCopyRounded />}
                onClick={copyBoardLink}
                sx={{ flexShrink: 0 }}
              >
                Copy board link
              </Button>
            )}
          </Stack>
        </Paper>
        {completionError && (
          <Alert
            severity="error"
            sx={{ mb: 3 }}
            action={
              <Button
                color="inherit"
                onClick={() => fetchSuggestedMessages()}
                disabled={isCompletionLoading}
              >
                Retry
              </Button>
            }
          >
            Couldn't load this board's questions. Please try again.
          </Alert>
        )}
        {isOwner ? (
          <>
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
                gap: { xs: 1, sm: 2 },
                mb: 3,
              }}
            >
              {[
                {
                  label: "Custom questions",
                  count: customQuestions.length,
                  tab: "questions",
                  color: "var(--champ-primary)",
                },
                {
                  label: "Questions asked",
                  count: priorityQuestions.length,
                  tab: "questions",
                  color: "var(--champ-primary)",
                },
                {
                  label: "Shared answers",
                  count: answeredShowcase.filter(
                    (item) => !item.hiddenFromShowcase,
                  ).length,
                  tab: "showcase",
                  color: "var(--champ-warm)",
                },
              ].map((stat) => (
                <Button
                  key={stat.label}
                  onClick={() => setOwnerTab(stat.tab)}
                  sx={{
                    ...boardSurfaceSx,
                    bgcolor: "white",
                    p: { xs: 1.5, sm: 2.5 },
                    justifyContent: "flex-start",
                    textAlign: "left",
                    color: "text.primary",
                  }}
                >
                  <Box>
                    <Typography
                      component="span"
                      sx={{
                        display: "block",
                        color: stat.color,
                        fontWeight: 750,
                        fontSize: { xs: 24, sm: 30 },
                        fontVariantNumeric: "tabular-nums",
                      }}
                    >
                      {isCompletionLoading || completionError
                        ? "—"
                        : stat.count}
                    </Typography>
                    <Typography
                      component="span"
                      sx={{
                        fontSize: { xs: 11, sm: 13 },
                        color: "text.secondary",
                      }}
                    >
                      {stat.label}
                    </Typography>
                  </Box>
                </Button>
              ))}
            </Box>
            <Stack
              direction={{ xs: "column", sm: "row" }}
              justifyContent="space-between"
              gap={2}
              sx={{ mb: 3 }}
            >
              <Tabs
                value={ownerTab}
                onChange={(_, tab) => setOwnerTab(tab)}
                aria-label="Board management"
                variant="fullWidth"
                sx={{
                  bgcolor: "var(--champ-soft)",
                  borderRadius: 2,
                  p: 0.5,
                  width: { xs: "100%", sm: 480 },
                  minHeight: 48,
                  "& .MuiTabs-indicator": { display: "none" },
                  "& .MuiTab-root": {
                    minWidth: 0,
                    minHeight: 44,
                    borderRadius: 1.5,
                    px: 1,
                    fontSize: { xs: 11, sm: 13 },
                    textTransform: "none",
                  },
                  "& .Mui-selected": {
                    bgcolor: "white",
                    boxShadow: "0 2px 6px color-mix(in srgb, var(--champ-ink) 3.14%, transparent)",
                  },
                }}
              >
                {ownerTabs.map((tab) => (
                  <Tab
                    key={tab.value}
                    value={tab.value}
                    label={tab.label}
                    icon={isMobileView ? undefined : tab.icon}
                    iconPosition="start"
                    id={`board-tab-${tab.value}`}
                    aria-controls={`board-panel-${tab.value}`}
                  />
                ))}
              </Tabs>
              {ownerTab !== "embed" && hostFilterControl}
            </Stack>
            <Box
              key={ownerTab}
              className="workspace-reveal"
              role="tabpanel"
              id={`board-panel-${ownerTab}`}
              aria-labelledby={`board-tab-${ownerTab}`}
            >
              {ownerTab === "board" && ownerBoardPanel}
              {ownerTab === "questions" && questionsPanel}
              {ownerTab === "showcase" && answerShowcasePanel}
              {ownerTab === "embed" && <EmbedSetupPanel username={username} />}
            </Box>
          </>
        ) : (
          <>
            {hasAnsweredShowcase && (
              <Box sx={{ display: { xs: "block", md: "none" }, mb: 3 }}>
                <Tabs
                  aria-label="Public board sections"
                  value={mobileTab}
                  onChange={(_, tab) => setMobileTab(tab)}
                  variant="fullWidth"
                >
                  <Tab
                    value="board"
                    label="Leave a note"
                    id="public-tab-board"
                    aria-controls="public-panel-board"
                  />
                  <Tab
                    value="showcase"
                    label="Shared answers"
                    id="public-tab-showcase"
                    aria-controls="public-panel-showcase"
                  />
                </Tabs>
              </Box>
            )}
            {hostFilterControl && (
              <Box sx={{ display: "flex", justifyContent: "flex-end", mb: 3 }}>
                {hostFilterControl}
              </Box>
            )}
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: {
                  xs: "1fr",
                  md: hasAnsweredShowcase
                    ? "minmax(0, 1.4fr) minmax(0, 1fr)"
                    : "minmax(0, 760px)",
                },
                justifyContent: "center",
                gap: 3,
                alignItems: "start",
              }}
            >
              <Box
                id="public-panel-board"
                sx={{
                  display: {
                    xs: mobileTab === "board" ? "block" : "none",
                    md: "block",
                  },
                  minWidth: 0,
                }}
              >
                {boardPanel}
              </Box>
              {hasAnsweredShowcase && (
                <Box
                  id="public-panel-showcase"
                  sx={{
                    display: {
                      xs: mobileTab === "showcase" ? "block" : "none",
                      md: "block",
                    },
                    minWidth: 0,
                  }}
                >
                  {answerShowcasePanel}
                </Box>
              )}
            </Box>
          </>
        )}
        <Typography
          variant="caption"
          color="text.secondary"
          align="center"
          sx={{ display: "block", mt: 5 }}
        >
          A little more connection. A little less noise.
        </Typography>
      </Box>
    </Box>
  );
}
