"use client";

import { authApiBase as AUTH_API_BASE } from "../../constants/config";

import {
  CalendarMonth as CalendarIcon,
  Email as EmailIcon,
  Link as LinkIcon,
} from "@mui/icons-material";
import {
  Avatar,
  Box,
  ButtonBase,
  Skeleton,
  Stack,
  Switch,
  Typography,
} from "@mui/material";
import axios from "axios";
import moment from "moment";
import { memo, useCallback, useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { useSelector } from "react-redux";
import { transformImageUrl } from "../../lib/features";

export default function Profile() {
  const { user } = useSelector((state) => state.auth);

  const baseUrl = typeof window !== "undefined" ? window.location.origin : "";
  const profileUrl = useMemo(
    () => `${baseUrl}/u/${user?.username || ""}`,
    [baseUrl, user?.username],
  );

  const copyToClipboard = useCallback(async () => {
    if (!profileUrl) return;
    try {
      await navigator.clipboard.writeText(profileUrl);
    } catch {
      toast.error("Could not copy the link. Please try again.");
      return;
    }
    toast.success("Profile URL copied to clipboard!", {
      duration: 2000,
    });
  }, [profileUrl]);

  const [isUpdating, setIsUpdating] = useState(false);
  const [isAcceptingMessage, setIsAcceptingMessage] = useState(
    user?.isAcceptingMessage || false,
  );

  useEffect(() => {
    setIsAcceptingMessage(Boolean(user?.isAcceptingMessage));
  }, [user?.isAcceptingMessage]);

  const handleAcceptMessages = useCallback(async () => {
    if (isUpdating) return;
    setIsUpdating(true);
    const nextState = !isAcceptingMessage;
    setIsAcceptingMessage(nextState);
    const toastId = toast.loading("Updating Accepting Messages...");
    try {
      const response = await axios.post(
        `${AUTH_API_BASE}/acceptMessages`,
        {
          isAcceptingMessage: nextState,
        },
        {
          withCredentials: true,
        },
      );

      if (response.data.success) {
        toast.success(
          `You are now ${nextState ? "accepting" : "not accepting"} messages!`,
          {
            duration: 1000,
            id: toastId,
          },
        );
      } else {
        setIsAcceptingMessage(!nextState);
        toast.error("Failed to update accepting messages", {
          duration: 1000,
          id: toastId,
        });
      }
    } catch (error) {
      setIsAcceptingMessage(!nextState);
      console.error(error);
      toast.error("Failed to update accepting messages", {
        duration: 1000,
        id: toastId,
      });
    } finally {
      setIsUpdating(false);
    }
  }, [isAcceptingMessage, isUpdating]);

  if (!user)
    return (
      <Stack sx={{ p: 3 }} spacing={2}>
        <Skeleton variant="circular" width={80} height={80} />
        <Skeleton height={40} />
        <Skeleton height={150} />
      </Stack>
    );

  return (
    <Stack
      className="workspace-root"
      spacing={3}
      sx={{
        height: "100%",
        minHeight: "100%",
        overflowY: "auto",
        bgcolor: "white",
        borderLeft: "1px solid var(--champ-border)",
        p: { xs: 2.5, xl: 3 },
      }}
    >
      <Typography
        component="h2"
        variant="overline"
        color="text.secondary"
        sx={{ letterSpacing: ".12em" }}
      >
        Your space
      </Typography>
      <Stack
        alignItems="center"
        className="workspace-reveal"
        spacing={1}
        sx={{ pb: 1 }}
      >
        <Avatar
          sx={{ width: 88, height: 88, border: "5px solid var(--champ-soft)", mb: 1 }}
          src={transformImageUrl(user?.avatar?.url)}
          alt={user.name}
        />
        <Typography variant="h6">{user.name}</Typography>
        <Typography variant="body2" color="text.secondary">
          @{user.username}
        </Typography>
      </Stack>
      <Box sx={{ borderRadius: 3, bgcolor: "var(--champ-field)", p: 2 }}>
        <Stack
          direction="row"
          alignItems="center"
          justifyContent="space-between"
          gap={1}
        >
          <Typography
            fontWeight={650}
            fontSize={13}
            id="anonymous-messages-label"
          >
            Anonymous inbox
          </Typography>
          <Switch
            disabled={isUpdating}
            checked={isAcceptingMessage}
            onChange={handleAcceptMessages}
            size="small"
            slotProps={{
              input: { "aria-labelledby": "anonymous-messages-label" },
            }}
          />
        </Stack>
        <Typography variant="caption" color="text.secondary">
          {isAcceptingMessage
            ? "Your link is open to new messages."
            : "Turn on to receive messages from your profile link."}
        </Typography>
      </Box>
      <Stack spacing={2.5}>
        <ProfileCard
          heading="Email address"
          text={user.email}
          Icon={<EmailIcon fontSize="small" />}
        />
        <ProfileCard
          heading="Part of the community for"
          text={moment(user.createdAt).fromNow(true)}
          Icon={<CalendarIcon fontSize="small" />}
        />
      </Stack>
      {isAcceptingMessage && (
        <ButtonBase
          onClick={copyToClipboard}
          sx={{
            textAlign: "left",
            border: "1px solid var(--champ-border)",
            bgcolor: "var(--champ-soft)",
            borderRadius: 3,
            p: 2,
            gap: 1.5,
            justifyContent: "flex-start",
            color: "primary.main",
          }}
        >
          <LinkIcon />
          <Box sx={{ minWidth: 0 }}>
            <Typography fontWeight={650} fontSize={13}>
              Copy your profile link
            </Typography>
            <Typography
              variant="caption"
              sx={{ display: "block", overflowWrap: "anywhere" }}
            >
              Share a little space for honest thoughts.
            </Typography>
          </Box>
        </ButtonBase>
      )}
      <Box sx={{ flex: 1 }} />
      <Typography variant="caption" color="text.secondary" textAlign="center">
        A little more connection. A little less noise.
      </Typography>
    </Stack>
  );
}

const ProfileCard = memo(({ text, Icon, heading }) => (
  <Stack direction="row" spacing={1.5} alignItems="center">
    <Box
      sx={{
        display: "grid",
        placeItems: "center",
        bgcolor: "var(--champ-soft)",
        borderRadius: 2,
        width: 36,
        height: 36,
        flexShrink: 0,
        color: "text.secondary",
      }}
    >
      {Icon}
    </Box>
    <Box sx={{ minWidth: 0 }}>
      <Typography variant="caption" color="text.secondary">
        {heading}
      </Typography>
      <Typography
        fontSize={13}
        fontWeight={550}
        sx={{ overflowWrap: "anywhere" }}
      >
        {text}
      </Typography>
    </Box>
  </Stack>
));
