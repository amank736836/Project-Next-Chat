"use client";

import {
  Box,
  Button,
  CircularProgress,
  Paper,
  Tab,
  Tabs,
  Pagination,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import axios from "axios";
import { useCallback, useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { useSelector } from "react-redux";
import { useParams } from "next/navigation";
import { useTheme } from "@mui/material/styles";
import useMediaQuery from "@mui/material/useMediaQuery";
import { nextBackend, socketBackend } from "../../../constants/config";
import { gradientBg } from "../../../constants/color";

const NEXT_QUESTIONS_API_BASE = `${nextBackend}/chat/questions`;
const ASK_AND_RECORD_API_BASE = `${socketBackend}/chat/ask-and-record`;

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

  const { user } = useSelector((state) => state.auth);
  const [viewerUsername, setViewerUsername] = useState("");

  const normalizedUsername = (username || "").toLowerCase();
  const normalizedUserUsername = (user?.username || "").toLowerCase();
  const normalizedViewerUsername = (viewerUsername || "").toLowerCase();
  const isOwner = Boolean(
    normalizedUsername &&
      (normalizedUserUsername === normalizedUsername ||
        normalizedViewerUsername === normalizedUsername)
  );

  const [content, setContent] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [messageString, setMessageString] = useState(initialMessageString);
  const [messageArray, setMessageArray] = useState([]);
  const [isCompletionLoading, setIsCompletionLoading] = useState(false);
  const [completionError, setCompletionError] = useState(null);
  const [answeredShowcase, setAnsweredShowcase] = useState([]);
  const [customQuestions, setCustomQuestions] = useState([]);
  const [newQuestion, setNewQuestion] = useState("");
  const [savingQuestionId, setSavingQuestionId] = useState(null);
  const [deletingQuestionId, setDeletingQuestionId] = useState(null);
  const [hidingShowcaseId, setHidingShowcaseId] = useState(null);
  const [mobileTab, setMobileTab] = useState("board");
  const [answerShowcasePage, setAnswerShowcasePage] = useState(1);
  const hasAnsweredShowcase = answeredShowcase.length > 0;
  const totalAnswerShowcasePages = Math.max(
    Math.ceil(answeredShowcase.length / ANSWER_SHOWCASE_PAGE_SIZE),
    1
  );
  const pagedAnsweredShowcase = useMemo(() => {
    const startIndex = (answerShowcasePage - 1) * ANSWER_SHOWCASE_PAGE_SIZE;
    return answeredShowcase.slice(startIndex, startIndex + ANSWER_SHOWCASE_PAGE_SIZE);
  }, [answerShowcasePage, answeredShowcase]);

  useEffect(() => {
    let isMounted = true;

    const fetchViewer = async () => {
      try {
        const { data } = await axios.get(`${nextBackend}/user/me`, {
          withCredentials: true,
        });

        if (isMounted) {
          setViewerUsername(data?.user?.username || "");
        }
      } catch {
        if (isMounted) {
          setViewerUsername("");
        }
      }
    };

    fetchViewer();

    return () => {
      isMounted = false;
    };
  }, []);

  const fetchSuggestedMessages = useCallback(async ({ refresh = false, exclude = "" } = {}) => {
    setIsCompletionLoading(true);
    try {
      const response = await axios.get(NEXT_QUESTIONS_API_BASE, {
        params: {
          username,
          exclude,
          refresh,
        },
      });

      if (response.data.success) {
        const nextSuggestions = (response.data.suggestions || []).join(specialChar);
        setMessageString(nextSuggestions || initialMessageString);
        setAnsweredShowcase(response.data.answered || []);
        setCustomQuestions(response.data.customQuestions || []);

        setCompletionError(null);
      } else {
        setMessageString(initialMessageString);
        toast.error("Failed to fetch suggested messages. Please try again.");
      }
    } catch (error) {
      console.error(error);
      toast.error("Failed to fetch suggested messages. Please try again.");
      setCompletionError(error);
    } finally {
      setIsCompletionLoading(false);
    }
  }, [username]);

  const fetchAnswerShowcase = useCallback(async () => {
    if (!username) return;

    try {
      const response = await axios.get(NEXT_QUESTIONS_API_BASE, {
        params: {
          username,
        },
      });

      if (response.data.success) {
        setAnsweredShowcase(response.data.answered || []);
      }
    } catch (error) {
      console.error(error);
    }
  }, [username]);

  const saveQuestion = async ({ questionId = null, question }) => {
    setSavingQuestionId(questionId || "new");
    try {
      const response = await axios.put(NEXT_QUESTIONS_API_BASE, {
        username,
        questionId,
        question,
      });

      if (response.data.success) {
        toast.success("Question saved successfully");
        setNewQuestion("");
        fetchSuggestedMessages({ exclude: messageString });
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
        setCustomQuestions((prev) => prev.filter((item) => item.id !== questionId));
        await fetchSuggestedMessages({ refresh: false, exclude: messageString });
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
    if (!content) return;

    if (isOwner) {
      toast.error("Owner cannot ask questions on own board.");
      return;
    }

    setIsLoading(true);
    try {
      const askedQuestion = content.trim();

      const response = await axios.post(ASK_AND_RECORD_API_BASE, {
        username,
        question: askedQuestion,
        content: askedQuestion,
        sender: user,
      });

      if (response.data.success && response.data.alreadyAnswered) {
        toast.success("This question is already answered. Showing existing answer.");
        setAnsweredShowcase((prev) => {
          const exists = prev.some(
            (item) => item.question.toLowerCase() === response.data.answeredQuestion.toLowerCase()
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
        await fetchSuggestedMessages({ refresh: true, exclude: messageString });
      } else if (response.data.success && !response.data.alreadyAnswered) {
        // Message was saved to DB even if socket delivery had issues
        toast.success("Message saved successfully.");
        setContent("");
        await fetchSuggestedMessages({ refresh: true, exclude: messageString });
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
    fetchAnswerShowcase();
  }, [username, fetchSuggestedMessages, fetchAnswerShowcase]);

  useEffect(() => {
    if (!hasAnsweredShowcase && mobileTab === "showcase") {
      setMobileTab("board");
    }
  }, [hasAnsweredShowcase, mobileTab]);

  useEffect(() => {
    setAnswerShowcasePage((currentPage) => Math.min(currentPage, totalAnswerShowcasePages));
  }, [totalAnswerShowcasePages]);

  const handleMessageClick = (msg) => {
    if (isOwner) return;
    setContent(msg);
  };

  const handleSuggestionTemplateClick = (msg) => {
    if (!isOwner) return;
    setNewQuestion(msg);
  };

  const suggestionVisibleCount = isMobileView ? 3 : 4;

  const hideShowcaseItem = async (item) => {
    if (!isOwner || !item?.id || !item?.itemType) return;

    setHidingShowcaseId(item.id);
    try {
      const response = await axios.patch(NEXT_QUESTIONS_API_BASE, {
        username,
        itemId: item.id,
        itemType: item.itemType,
      });

      if (response.data.success) {
        setAnsweredShowcase((prev) => prev.filter((entry) => entry.id !== item.id));
        toast.success("Showcase item hidden");
      } else {
        toast.error("Failed to hide showcase item");
      }
    } catch (error) {
      console.error(error);
      toast.error("Failed to hide showcase item");
    } finally {
      setHidingShowcaseId(null);
    }
  };

  const boardPanel = (
    <Stack
      spacing={3}
      component={Paper}
      elevation={4}
      sx={{
        width: "100%",
        padding: { xs: "1.25rem", sm: "2rem" },
        borderRadius: "16px",
      }}
    >
      <Typography
        variant={isMobileView ? "h6" : "h5"}
        align="center"
        fontWeight={600}
        sx={{ fontSize: { xs: "1rem", sm: "1.5rem" } }}
      >
        {isOwner ? `Manage Your Message Board (@${username})` : `Send Anonymous Message to @${username}`}
      </Typography>

      {!isOwner ? (
        <form onSubmit={handleSubmit}>
          <TextField
            fullWidth
            multiline
            rows={4}
            placeholder="Write your anonymous message here"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            variant="outlined"
          />
          <Button
            type="submit"
            fullWidth
            variant="contained"
            disabled={isLoading || !content}
            sx={{ mt: 2 }}
          >
            {isLoading ? <CircularProgress size={24} /> : "Send Message"}
          </Button>
        </form>
      ) : (
        <Stack spacing={1.5}>
          <Typography variant={isMobileView ? "subtitle1" : "h6"} sx={{ fontSize: { xs: "0.95rem", sm: "1.25rem" } }}>
            Create Custom Question
          </Typography>
          <TextField
            fullWidth
            label="Question"
            value={newQuestion}
            onChange={(e) => setNewQuestion(e.target.value)}
          />
          <Button
            variant="contained"
            disabled={!newQuestion.trim() || savingQuestionId === "new"}
            onClick={() => saveQuestion({ question: newQuestion })}
          >
            {savingQuestionId === "new" ? <CircularProgress size={20} /> : "Save Custom Question"}
          </Button>

          <Box>
            <Typography
              variant={isMobileView ? "subtitle2" : "subtitle1"}
              sx={{ mb: 1, fontSize: { xs: "0.8rem", sm: "1rem" } }}
            >
              Your Custom Questions
            </Typography>

            {customQuestions.length > 0 ? (
              <Stack spacing={1}>
                {customQuestions.map((item) => (
                  <Paper key={item.id} variant="outlined" sx={{ p: 1 }}>
                    <Stack direction="row" justifyContent="space-between" alignItems="center" spacing={1}>
                      <Typography variant="body2" sx={{ flex: 1 }}>
                        {item.question}
                      </Typography>
                      <Button
                        size="small"
                        color="error"
                        variant="outlined"
                        onClick={() => deleteCustomQuestion(item.id)}
                        disabled={deletingQuestionId === item.id}
                      >
                        {deletingQuestionId === item.id ? "Deleting..." : "Delete"}
                      </Button>
                    </Stack>
                  </Paper>
                ))}
              </Stack>
            ) : (
              <Typography variant="body2" color="text.secondary">
                No custom questions yet.
              </Typography>
            )}
          </Box>
        </Stack>
      )}

      <Button
        fullWidth
        variant="outlined"
        onClick={() => fetchSuggestedMessages({ refresh: true, exclude: messageString })}
        disabled={isCompletionLoading}
        sx={{ py: { xs: 0.75, sm: 1 } }}
      >
        {isCompletionLoading ? <CircularProgress size={20} /> : "Suggest Messages"}
      </Button>

      {completionError && (
        <Typography color="error" textAlign="center">
          {completionError.message}
        </Typography>
      )}

      <Box>
        <Typography variant={isMobileView ? "subtitle1" : "h6"} gutterBottom sx={{ fontSize: { xs: "0.95rem", sm: "1.25rem" } }}>
          {isOwner ? "Unanswered Suggestions (for visitors)" : "Suggested Messages"}
        </Typography>
        {isOwner ? (
          messageArray.length > 0 ? (
            <>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1, fontSize: { xs: "0.72rem", sm: "0.875rem" } }}>
                Click a suggestion to use it as a custom question.
              </Typography>
              <Stack spacing={1}>
                {messageArray.slice(0, suggestionVisibleCount).map((msg, i) => (
                  <Button
                    key={i}
                    onClick={() => handleSuggestionTemplateClick(msg)}
                    variant={newQuestion === msg ? "contained" : "outlined"}
                    fullWidth
                    sx={{
                      justifyContent: "flex-start",
                      fontSize: { xs: "0.72rem", sm: "0.875rem" },
                      py: { xs: 0.7, sm: 1 },
                      px: { xs: 1, sm: 1.5 },
                    }}
                  >
                    {msg}
                  </Button>
                ))}
              </Stack>
            </>
          ) : (
            <Typography variant="body2" color="text.secondary" sx={{ fontSize: { xs: "0.72rem", sm: "0.875rem" } }}>
              No suggestions available right now.
            </Typography>
          )
        ) : messageArray.length > 0 ? (
          <Stack spacing={1}>
            {messageArray.slice(0, suggestionVisibleCount).map((msg, i) => (
              <Button
                key={i}
                onClick={() => handleMessageClick(msg)}
                variant="outlined"
                fullWidth
                sx={{
                  justifyContent: "flex-start",
                  fontSize: { xs: "0.72rem", sm: "0.875rem" },
                  py: { xs: 0.7, sm: 1 },
                  px: { xs: 1, sm: 1.5 },
                }}
              >
                {msg}
              </Button>
            ))}
          </Stack>
        ) : (
          <Typography sx={{ fontSize: { xs: "0.72rem", sm: "0.875rem" } }}>No messages to suggest</Typography>
        )}
      </Box>

      <Box textAlign="center" mt={2}>
        <Typography variant="body2" color="text.secondary" sx={{ fontSize: { xs: "0.72rem", sm: "0.875rem" } }}>
          Get Your Own Message Board
        </Typography>
        <Button
          href="/login"
          variant="contained"
          sx={{ mt: 1, px: 3, borderRadius: "999px", fontSize: { xs: "0.72rem", sm: "0.875rem" }, py: { xs: 0.75, sm: 1 } }}
        >
          Create Your Account
        </Button>
      </Box>
    </Stack>
  );

  const answerShowcasePanel = (
    <Paper
      elevation={3}
      sx={{
        p: 2,
        borderRadius: "16px",
        position: { md: "sticky" },
        top: { md: 24 },
        maxHeight: { md: "calc(100vh - 48px)" },
        overflowY: { md: "auto" },
      }}
    >
      <Typography variant="h6" gutterBottom>
        Answer Showcase
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Previously answered public board questions for @{username}
      </Typography>

      {pagedAnsweredShowcase.length > 0 ? (
        <Stack spacing={1.5}>
          {pagedAnsweredShowcase.map((item) => (
            <Paper key={item.id} variant="outlined" sx={{ p: 1.5 }}>
              {isOwner && item.itemType && (
                <Box sx={{ display: "flex", justifyContent: "flex-end" }}>
                  <Button
                    size="small"
                    color="error"
                    onClick={() => hideShowcaseItem(item)}
                    disabled={hidingShowcaseId === item.id}
                  >
                    {hidingShowcaseId === item.id ? "Hiding..." : "Hide"}
                  </Button>
                </Box>
              )}
              <Typography variant="caption" color="text.secondary" sx={{ display: "block" }}>
                Question
              </Typography>
              <Typography fontWeight={600}>{item.question}</Typography>
              <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 1 }}>
                Answer
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                {item.answer}
              </Typography>
            </Paper>
          ))}
        </Stack>
      ) : (
        <Typography variant="body2" color="text.secondary">
          No answered questions yet
        </Typography>
      )}

      {answeredShowcase.length > ANSWER_SHOWCASE_PAGE_SIZE && (
        <Stack sx={{ mt: 2 }} alignItems="center">
          <Pagination
            count={totalAnswerShowcasePages}
            page={answerShowcasePage}
            onChange={(_, nextPage) => setAnswerShowcasePage(nextPage)}
            color="primary"
            shape="rounded"
          />
        </Stack>
      )}
    </Paper>
  );

  return (
    <Box
      sx={{
        minHeight: "100vh",
        background: gradientBg,
        display: "flex",
        justifyContent: "center",
        alignItems: "flex-start",
        padding: { xs: "0.75rem", sm: "2rem" },
      }}
    >
      <Box
        sx={{
          width: "100%",
          maxWidth: 1150,
          display: "grid",
          gap: { xs: 1.5, sm: 3 },
          gridTemplateColumns: {
            xs: "1fr",
            md: hasAnsweredShowcase ? "minmax(0, 2fr) minmax(280px, 1fr)" : "1fr",
          },
          justifyItems: { md: hasAnsweredShowcase ? "stretch" : "center" },
        }}
      >
        {hasAnsweredShowcase && (
          <Box sx={{ display: { xs: "block", md: "none" }, gridColumn: "1 / -1" }}>
            <Paper elevation={2} sx={{ mb: 1, borderRadius: "14px" }}>
              <Tabs
                value={mobileTab}
                onChange={(_, nextTab) => setMobileTab(nextTab)}
                variant="fullWidth"
                indicatorColor="primary"
                textColor="primary"
              >
                <Tab value="board" label="Board" />
                <Tab value="showcase" label="Answer Showcase" />
              </Tabs>
            </Paper>
          </Box>
        )}

        <Box
          sx={{
            display: { xs: mobileTab === "board" ? "block" : "none", md: "block" },
            width: { md: hasAnsweredShowcase ? "100%" : "min(100%, 620px)" },
          }}
        >
          {boardPanel}
        </Box>

        {hasAnsweredShowcase && (
          <Box sx={{ display: { xs: mobileTab === "showcase" ? "block" : "none", md: "block" } }}>
            {answerShowcasePanel}
          </Box>
        )}
      </Box>
    </Box>
  );
}
