"use client";

import { Box, Button, Typography } from "@mui/material";
import useReducedMotionSafe from "../animations/useReducedMotionSafe";
import { motion } from "framer-motion";
import moment from "moment";
import { memo, useCallback, useMemo } from "react";
import { useSelector } from "react-redux";
import { lightBlue } from "../../constants/color";
import { fileFormat } from "../../lib/features";
import RenderAttachment from "./RenderAttachment";
import {
  useSendAnonymousFriendRequestMutation,
  useSendFriendRequestMutation,
} from "../../redux/api/api";
import { useAsyncMutation, useErrors } from "../../hooks/useHooks";

function MessageComponent({ message, onReply, onShareAi, onDismissAi }) {
  const reducedMotion = useReducedMotionSafe();
  const { user } = useSelector((state) => state.auth);
  const { sender, content, attachments = [], createdAt } = message;
  const isAnonymousMessage = useMemo(
    () =>
      Boolean(message?.isAnonymous) ||
      String(sender?.name || "").trim().toLowerCase() === "anonymous",
    [message?.isAnonymous, sender?.name]
  );

  const isSender = useMemo(
    () =>
      !isAnonymousMessage &&
      String(sender?._id || "") === String(user?._id || ""),
    [isAnonymousMessage, sender?._id, user?._id]
  );
  const isRightAligned = isSender;
  const isAi =
    message?.aiOnly === true ||
    String(sender?._id || "") === "ai" ||
    String(sender?.name || "").toLowerCase() === "ai assistant";
  // Persisted private AI answers carry privateTo; only their owner receives them.
  const isPrivateAi = Boolean(message?.privateTo) || message?.aiOnly === true;

  const timeAgo = useMemo(() => moment(createdAt).fromNow(), [createdAt]);

  const [
    sendFriendRequest,
    {
      isLoading: isLoadingSendFriendRequest,
      isError: sendFriendRequestError,
      error: sendFriendRequestErrorData,
    },
  ] = useAsyncMutation(useSendFriendRequestMutation);
  const [
    sendAnonymousFriendRequest,
    {
      isLoading: isLoadingAnonymousFriendRequest,
      isError: anonymousFriendRequestError,
      error: anonymousFriendRequestErrorData,
    },
  ] = useAsyncMutation(useSendAnonymousFriendRequestMutation);

  useErrors([
    {
      isError: sendFriendRequestError,
      error: sendFriendRequestErrorData,
    },
    {
      isError: anonymousFriendRequestError,
      error: anonymousFriendRequestErrorData,
    },
  ]);

  const sendFriendRequestHandler = useCallback(async (userId) => {
    if (!userId) return;
    await sendFriendRequest("Sending friend request...", userId);
  }, [sendFriendRequest]);

  const sendAnonymousFriendRequestHandler = useCallback(async (messageId) => {
    if (!messageId) return;
    await sendAnonymousFriendRequest("Sending friend request...", messageId);
  }, [sendAnonymousFriendRequest]);

  const handleReplyClick = useCallback(() => {
    if (!onReply) return;

    onReply({
      id: message._id,
      senderName: sender?.name || "Anonymous",
      content: content || "",
    });
  }, [onReply, message._id, sender?.name, content]);

  return (
    <motion.div
      className="workspace-message"
      initial={reducedMotion ? false : { opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: reducedMotion ? 0 : 0.2, ease: "easeInOut" }}
      style={{
        alignSelf: isRightAligned ? "flex-end" : "flex-start",
        color: isRightAligned ? "white" : "#202b45",
        backgroundColor: isAi ? "#f0edfc" : isRightAligned ? "#4361d8" : "white",
        border: isRightAligned ? "none" : "1px solid #e5eaf3",
        boxShadow: "0 2px 5px #202b4505",
        borderRadius: isRightAligned ? "16px 16px 4px 16px" : "16px 16px 16px 4px",
        padding: "0.75rem 1rem",
        width: "fit-content",
      }}
    >
      {!isRightAligned && (
        <Typography color={lightBlue} fontWeight={600} variant="caption">
          {isAi ? "✨ AI Assistant" : isAnonymousMessage ? "Anonymous" : sender?.name || "Anonymous"}
        </Typography>
      )}

      {!isSender &&
        !isAnonymousMessage &&
        sender?._id &&
        String(message.chat || "") === String(user?._id || "") && (
        <Button
          onClick={() => sendFriendRequestHandler(sender._id)}
          disabled={isLoadingSendFriendRequest}
          variant="outlined"
          size="small"
          sx={{
            marginLeft: "0.5rem",
            color: lightBlue,
            borderColor: lightBlue,
          }}
        >
          {isLoadingSendFriendRequest ? "Sending..." : "Add Friend"}
        </Button>
      )}

      {!isSender &&
        isAnonymousMessage &&
        message?.canAddFriend && (
        <Button
          onClick={() => sendAnonymousFriendRequestHandler(message._id)}
          disabled={isLoadingAnonymousFriendRequest}
          variant="outlined"
          size="small"
          sx={{
            marginLeft: "0.5rem",
            color: lightBlue,
            borderColor: lightBlue,
          }}
        >
          {isLoadingAnonymousFriendRequest ? "Sending..." : "Add Friend"}
        </Button>
      )}

      {attachments.length > 0 &&
        attachments.map((attachment, index) => {
          const url = attachment.url;
          const fileType = fileFormat(url);
          return (
            <Box key={index}>
              <a
                href={url}
                target="_blank"
                download
                style={{
                  color: isRightAligned ? "white" : "#202b45",
                }}
              >
                {RenderAttachment(fileType, url)}
              </a>
            </Box>
          );
        })}

      {content && <Typography sx={{ whiteSpace: "pre-wrap", fontSize: 14, lineHeight: 1.65 }}>{content}</Typography>}

      {isPrivateAi && (
        <Typography variant="caption" sx={{ opacity: 0.6, display: "block" }}>
          Only visible to you
        </Typography>
      )}

      {isPrivateAi && (onShareAi || onDismissAi) && (
        <Box sx={{ display: "flex", gap: 1, mt: 0.5 }}>
          {onShareAi && (
            <Button
              size="small"
              variant="contained"
              onClick={() => onShareAi(message)}
              sx={{ textTransform: "none", borderRadius: "999px" }}
            >
              Share with chat
            </Button>
          )}
          {onDismissAi && (
            <Button
              size="small"
              variant="text"
              onClick={() => onDismissAi(message)}
              sx={{ textTransform: "none" }}
            >
              Dismiss
            </Button>
          )}
        </Box>
      )}

      <Box
        sx={{
          mt: 0.4,
          display: "flex",
          alignItems: "center",
          gap: 0.8,
        }}
      >
        <Typography variant="caption" color={isRightAligned ? "#e4eaff" : "text.secondary"}>
          {timeAgo}
        </Typography>
        {!isAi && (
          <Button
            size="small"
            variant="text"
            onClick={handleReplyClick}
            sx={{
              minWidth: "auto",
              p: 0,
              lineHeight: 1,
              textTransform: "none",
              color: isRightAligned ? "white" : "#1976d2",
            }}
          >
            Reply
          </Button>
        )}
      </Box>
    </motion.div>
  );
}

export default memo(MessageComponent);
