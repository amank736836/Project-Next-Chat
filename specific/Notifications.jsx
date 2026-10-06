"use client";

import { CloseRounded } from "@mui/icons-material";

import {
  Avatar,
  Box,
  IconButton,
  Button,
  Dialog,
  DialogTitle,
  List,
  ListItem,
  Skeleton,
  Stack,
  Typography,
} from "@mui/material";
import { useCallback, useEffect, useMemo, useState, memo } from "react";
import toast from "react-hot-toast";
import { useDispatch, useSelector } from "react-redux";
import { dialogBg } from "../constants/color";
import { useAsyncMutation, useErrors } from "../hooks/useHooks";
import { transformImageUrl } from "../lib/features";
import {
  useAcceptFriendRequestMutation,
  useGetNotificationsQuery,
} from "../redux/api/api";
import { setIsNotification } from "../redux/reducers/misc.reducer";

export default function Notifications() {
  const { isNotification } = useSelector((state) => state.misc);

  const [notificationList, setNotificationList] = useState([]);

  const dispatch = useDispatch();

  const [
    acceptFriendRequest,
    {
      data: acceptFriendRequestData,
      isLoading: isLoadingAcceptFriendRequest,
      isError: isErrorAcceptFriendRequest,
      error: errorAcceptFriendRequest,
    },
  ] = useAsyncMutation(useAcceptFriendRequestMutation);

  const {
    data: notificationsData,
    isLoading: isLoadingNotifications,
    isError: isErrorNotifications,
    error: errorNotifications,
  } = useGetNotificationsQuery();

  useErrors([
    {
      isError: isErrorNotifications,
      error: errorNotifications,
    },
    {
      isError: isErrorAcceptFriendRequest,
      error: errorAcceptFriendRequest,
    },
  ]);

  const closeNotification = useCallback(() => {
    dispatch(setIsNotification(false));
  }, [dispatch]);

  const friendRequestHandler = useCallback(async ({ _id, accept }) => {
    await acceptFriendRequest("Accepting Friend Request...", {
      requestId: _id,
      accept,
    });
  }, [acceptFriendRequest]);

  useEffect(() => {
    if (acceptFriendRequestData?.success) {
      toast.success(acceptFriendRequestData.message, {
        duration: 1000,
      });
      setNotificationList((prev) =>
        prev.filter(
          (notification) =>
            (notification.sender?._id || notification.sender?.id) !==
            acceptFriendRequestData.senderId
        )
      );
    }
  }, [acceptFriendRequestData]);

  useEffect(() => {
    if (notificationsData) {
      setNotificationList(notificationsData.allRequests || []);
    }
  }, [notificationsData]);

  const renderedNotifications = useMemo(
    () =>
      notificationList.map((notification) => (
        <NotificationItem
          sender={notification.sender}
          _id={notification._id}
          handler={friendRequestHandler}
          key={notification._id}
        />
      )),
    [notificationList, friendRequestHandler]
  );

  return (
    <Dialog className="workspace-root" aria-labelledby="notifications-title" open={isNotification} onClose={closeNotification} maxWidth="sm" fullWidth>
      <Box
        sx={{
          p: { xs: 2.5, sm: 4 },
          width: "100%",
          position: "relative",
          background: dialogBg,
          boxShadow: "0px 4px 12px rgba(0, 0, 0, 0.1)",
          "&::-webkit-scrollbar": {
            display: "none",
          },
          overflow: "auto",
        }}
      >
        <IconButton aria-label="Close dialog" onClick={closeNotification} sx={{ position: "absolute", right: 10, top: 10 }}><CloseRounded /></IconButton>
        <DialogTitle id="notifications-title"
          textAlign="center"
          fontWeight={600}
          color="#333"
          sx={{ pb: 2 }}
        >
          Friendship Requests
        </DialogTitle>

        <List
          sx={{
            maxHeight: "300px",
            overflowY: "auto",
            borderRadius: "8px",
            backgroundColor: "white",
            p: "0.5rem",
            border: "1px solid var(--champ-border)",
            "&::-webkit-scrollbar": {
              display: "none",
            },
          }}
        >
          {isLoadingNotifications ? (
            <Skeleton
              variant="rectangular"
              width={"100%"}
              height={100}
              sx={{
                borderRadius: "8px",
                mb: "0.5rem",
                background:
                  "linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%)",
                animation: "loading 1.5s infinite",
              }}
            />
          ) : notificationList.length > 0 ? (
            renderedNotifications
          ) : (
            <Typography textAlign="center" color="gray">
              {notificationList.length === 0
                ? "No Notifications yet"
                : "Error fetching notifications"}
            </Typography>
          )}
        </List>
      </Box>
    </Dialog>
  );
}

const NotificationItem = memo(({ sender, _id, handler }) => {
  const { name, avatar } = sender;

  return (
    <>
      <ListItem
        sx={{
          display: "flex",
          alignItems: "center",
          background: "white",
          borderRadius: "8px",
          boxShadow: "0px 2px 8px rgba(0, 0, 0, 0.1)",
          p: "1rem",
          mb: "0.5rem",
        }}
      >
        <Avatar
          src={transformImageUrl(avatar)}
          sx={{ width: 50, height: 50 }}
        />
        <Stack
          direction={{
            xs: "column",
            sm: "row",
          }}
          alignItems={"center"}
          width={"100%"}
        >
          <Typography
            variant="body1"
            sx={{
              flexGrow: 1,
              display: "-webkit-box",
              WebkitLineClamp: 1,
              WebkitBoxOrient: "vertical",
              overflow: "auto",
              textOverflow: "ellipsis",
              ml: "1rem",
            }}
          >
            {name}
          </Typography>
          <Stack spacing={1} direction={"row"} justifyContent="center">
            <Button
              onClick={() => handler({ _id, accept: true })}
              variant="contained"
              color="success"
              size="small"
            >
              Accept
            </Button>
            <Button
              onClick={() =>
                handler({
                  _id,
                  accept: false,
                })
              }
              variant="contained"
              color="error"
              size="small"
            >
              Reject
            </Button>
          </Stack>
        </Stack>
      </ListItem>
    </>
  );
});
