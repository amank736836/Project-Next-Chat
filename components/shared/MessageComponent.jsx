"use client";

import { Box, Button, Typography } from "@mui/material";
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

function MessageComponent({ message, onReply }) {
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
      initial={{ opacity: 0, x: isRightAligned ? 100 : -100 }}
      whileInView={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.2, ease: "easeInOut" }}
      style={{
        alignSelf: isRightAligned ? "flex-end" : "flex-start",
        color: isRightAligned ? "white" : "black",
        backgroundColor: isRightAligned ? "blue" : "lightgray",
        borderRadius: "5px",
        padding: "0.5rem",
        width: "fit-content",
      }}
    >
      {!isRightAligned && (
        <Typography color={lightBlue} fontWeight={600} variant="caption">
          {isAnonymousMessage ? "Anonymous" : sender?.name || "Anonymous"}
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
                  color: isRightAligned ? "white" : "black",
                }}
              >
                {RenderAttachment(fileType, url)}
              </a>
            </Box>
          );
        })}

      {content && <Typography>{content}</Typography>}

      <Box
        sx={{
          mt: 0.4,
          display: "flex",
          alignItems: "center",
          gap: 0.8,
        }}
      >
        <Typography variant="caption" color={isRightAligned ? "white" : "black"}>
          {timeAgo}
        </Typography>
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
      </Box>
    </motion.div>
  );
}

export default memo(MessageComponent);
