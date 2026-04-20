"use client";

import {
  Box,
  Button,
  CircularProgress,
  Paper,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import axios from "axios";
import { useCallback, useEffect, useState } from "react";
import toast from "react-hot-toast";
import { useSelector } from "react-redux";
import { useParams } from "next/navigation";
import { gradientBg } from "../../../constants/color";

const CHAT_API_BASE = "/api/v1/chat";
const QUESTIONS_API_BASE = "/api/v1/chat/questions";
const BACKEND_API_BASE = process.env.NEXT_PUBLIC_SERVER_URL;

const specialChar = "||";

const parseStringMessages = (messageString) => {
  return messageString
    .split(specialChar)
    .map((msg) => msg.trim())
    .filter(Boolean);
};

const initialMessageString =
  "What's your favorite movie?||Do you have any pets?||What's your dream job?";

export default function Username() {
  const params = useParams();
  const username = params.username;

  const { user } = useSelector((state) => state.auth);

  const normalizedUsername = (username || "").toLowerCase();
  const normalizedUserUsername = (user?.username || "").toLowerCase();
  const isOwner = Boolean(user && normalizedUserUsername === normalizedUsername);

  const [content, setContent] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [messageString, setMessageString] = useState(initialMessageString);
  const [messageArray, setMessageArray] = useState([]);
  const [isCompletionLoading, setIsCompletionLoading] = useState(false);
  const [completionError, setCompletionError] = useState(null);
  const [answeredShowcase, setAnsweredShowcase] = useState([]);
  const [newQuestion, setNewQuestion] = useState("");
  const [savingQuestionId, setSavingQuestionId] = useState(null);

  const fetchSuggestedMessages = useCallback(async ({ refresh = false } = {}) => {
    setIsCompletionLoading(true);
    try {
      const response = await axios.get(QUESTIONS_API_BASE, {
        params: {
          username,
          exclude: messageString,
          refresh,
        },
      });

      if (response.data.success) {
        const nextSuggestions = (response.data.suggestions || []).join(specialChar);
        setMessageString(nextSuggestions || initialMessageString);
        setAnsweredShowcase(response.data.answered || []);

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
  }, [messageString, username]);

  const saveQuestion = async ({ questionId = null, question }) => {
    setSavingQuestionId(questionId || "new");
    try {
      const response = await axios.put(QUESTIONS_API_BASE, {
        username,
        questionId,
        question,
      });

      if (response.data.success) {
        toast.success("Question saved successfully");
        setNewQuestion("");
        fetchSuggestedMessages();
      }
    } catch (error) {
      toast.error("Failed to save question");
    } finally {
      setSavingQuestionId(null);
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
      if (!BACKEND_API_BASE) {
        toast.error("NEXT_PUBLIC_SERVER_URL is required to send messages.");
        setIsLoading(false);
        return;
      }

      const askedQuestion = content.trim();

      const questionStatus = await axios.post(QUESTIONS_API_BASE, {
        username,
        question: askedQuestion,
      });

      if (questionStatus.data.success && questionStatus.data.alreadyAnswered) {
        toast.success("This question is already answered. Showing existing answer.");
        setAnsweredShowcase((prev) => {
          const exists = prev.some(
            (item) => item.question.toLowerCase() === questionStatus.data.question.toLowerCase()
          );
          if (exists) return prev;
          return [
            {
              id: `local-${Date.now()}`,
              question: questionStatus.data.question,
              answer: questionStatus.data.answer,
            },
            ...prev,
          ];
        });
        setContent("");
        return;
      }

      const response = await axios.post(`${BACKEND_API_BASE}/chat/sendMessage`, {
        content,
        username,
        sender: user,
      });

      toast.success(response.data.message || "Message sent");
      if (response.data.success) {
        setContent("");
        await fetchSuggestedMessages({ refresh: true });
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
    fetchSuggestedMessages({ refresh: false });
  }, [username, user, fetchSuggestedMessages]);

  const handleMessageClick = (msg) => {
    setContent(msg);
  };

  return (
    <Box
      sx={{
        minHeight: "100vh",
        background: gradientBg,
        display: "flex",
        justifyContent: "center",
        alignItems: "flex-start",
        padding: "2rem",
      }}
    >
      <Box
        sx={{
          width: "100%",
          maxWidth: 1150,
          display: "grid",
          gap: 3,
          gridTemplateColumns: { xs: "1fr", md: "minmax(0, 2fr) minmax(280px, 1fr)" },
        }}
      >
      <Stack
        spacing={3}
        component={Paper}
        elevation={4}
        sx={{
          width: "100%",
          padding: "2rem",
          borderRadius: "16px",
        }}
      >
        <Typography variant="h5" align="center" fontWeight={600}>
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
            <Typography variant="h6">Create Custom Question</Typography>
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
          </Stack>
        )}

        <Button
          fullWidth
          variant="outlined"
          onClick={() => fetchSuggestedMessages({ refresh: true })}
          disabled={isCompletionLoading}
        >
          {isCompletionLoading ? <CircularProgress size={20} /> : "Suggest Messages"}
        </Button>

        {completionError && (
          <Typography color="error" textAlign="center">
            {completionError.message}
          </Typography>
        )}

        <Box>
          <Typography variant="h6" gutterBottom>
            {isOwner ? "Unanswered Suggestions (for visitors)" : "Suggested Messages"}
          </Typography>
          {messageArray.length > 0 ? (
            <Stack spacing={1}>
              {messageArray.slice(0, 4).map((msg, i) => (
                <Button
                  key={i}
                  onClick={() => handleMessageClick(msg)}
                  variant="outlined"
                  fullWidth
                  sx={{ justifyContent: "flex-start" }}
                >
                  {msg}
                </Button>
              ))}
            </Stack>
          ) : (
            <Typography>No messages to suggest</Typography>
          )}
        </Box>

        <Box textAlign="center" mt={2}>
          <Typography variant="body2" color="text.secondary">
            Get Your Own Message Board
          </Typography>
          <Button
            href="/login"
            variant="contained"
            sx={{ mt: 1, px: 3, borderRadius: "999px" }}
          >
            Create Your Account
          </Button>
        </Box>
      </Stack>

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
          Previously answered questions for @{username}
        </Typography>

        {answeredShowcase.length > 0 ? (
          <Stack spacing={1.5}>
            {answeredShowcase.map((item) => (
              <Paper key={item.id} variant="outlined" sx={{ p: 1.5 }}>
                <Typography fontWeight={600}>{item.question}</Typography>
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
      </Paper>
      </Box>
    </Box>
  );
}
