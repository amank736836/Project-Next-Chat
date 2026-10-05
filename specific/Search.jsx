"use client";

import { CloseRounded } from "@mui/icons-material";

import { useInputValidation } from "6pp";
import { Search as SearchIcon } from "@mui/icons-material";
import {
  Box,
  IconButton,
  Dialog,
  DialogTitle,
  InputAdornment,
  List,
  Skeleton,
  TextField,
} from "@mui/material";
import { useCallback, useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { useDispatch, useSelector } from "react-redux";
import UserItem from "../components/shared/UserItem";
import { dialogBg } from "../constants/color";
import { useAsyncMutation, useErrors } from "../hooks/useHooks";
import {
  useLazySearchUserQuery,
  useSendFriendRequestMutation,
} from "../redux/api/api";
import { setIsSearch } from "../redux/reducers/misc.reducer";

export default function Search() {
  const { isSearch } = useSelector((state) => state.misc);

  const dispatch = useDispatch();

  const closeSearch = useCallback(() => {
    dispatch(setIsSearch(false));
  }, [dispatch]);

  const [users, setUsers] = useState([]);

  const search = useInputValidation("");

  const [
    searchUser,
    {
      isLoading: isLoadingSearchUser,
      isError: isErrorSearchUser,
      error: errorSearchUser,
    },
  ] = useLazySearchUserQuery();

  const [
    sendFriendRequest,
    {
      isLoading: isLoadingSendFriendRequest,
      isError: sendFriendRequestError,
      error: sendFriendRequestErrorData,
    },
  ] = useAsyncMutation(useSendFriendRequestMutation);

  useErrors([
    {
      isError: sendFriendRequestError,
      error: sendFriendRequestErrorData,
    },
    {
      isError: isErrorSearchUser,
      error: errorSearchUser,
    },
  ]);

  const sendFriendRequestHandler = useCallback(async (userId) => {
    if (!userId) return;
    await sendFriendRequest("Sending friend request...", userId);
    setUsers((prev) =>
      prev.filter((user) => (user.id || user._id) !== userId)
    );
  }, [sendFriendRequest]);

  useEffect(() => {
    if (!isSearch) return;

    const query = search.value.trim();

    const timeOutId = setTimeout(() => {
      const runSearch = async () => {
        try {
          const res = await searchUser(query);
          setUsers(res?.data?.users || []);
        } catch (error) {
          console.error(error);
          toast.error("Error fetching users");
        }
      };

      runSearch();
    }, 300);

    return () => {
      clearTimeout(timeOutId);
    };
  }, [isSearch, search.value, searchUser]);

  const renderedUsers = useMemo(
    () =>
      users.map((user) => (
        <UserItem
          user={user}
          key={user.id || user._id}
          handler={sendFriendRequestHandler}
          handlerIsLoading={isLoadingSendFriendRequest}
        />
      )),
    [users, sendFriendRequestHandler, isLoadingSendFriendRequest]
  );

  return (
    <Dialog className="workspace-root" aria-labelledby="find-friend-title" open={isSearch} onClose={closeSearch} maxWidth="sm" fullWidth>
      <Box
        sx={{
          p: { xs: 2.5, sm: 4 },
          width: "100%",
          position: "relative",
          background: dialogBg,
        }}
      >
        <IconButton aria-label="Close dialog" onClick={closeSearch} sx={{ position: "absolute", right: 10, top: 10 }}><CloseRounded /></IconButton>
        <DialogTitle id="find-friend-title"
          textAlign="center"
          fontWeight={600}
          color="#333"
          sx={{ pb: 2 }}
        >
          Find a Friend
        </DialogTitle>
        <TextField
          value={search.value}
          onChange={search.changeHandler}
          variant="outlined"
          size="medium"
          placeholder="Search for a friend…"
          sx={{
            width: "100%",
            bgcolor: "white",
            borderRadius: "8px",
            mb: 2,
          }}
          slotProps={{
            htmlInput: { "aria-label": "Search for a friend" },
            input: {
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon sx={{ color: "#555" }} />
                </InputAdornment>
              ),
            },
          }}
        />

        <List
          key={"SearchList"}
          sx={{
            maxHeight: "300px",
            overflowY: "auto",
            borderRadius: "8px",
            backgroundColor: "white",
            p: "0.5rem",
            border: "1px solid #e7ecf4",
            "&::-webkit-scrollbar": {
              display: "none",
            },
          }}
        >
          {isLoadingSearchUser ? (
            <Box
              key={"loadingUsers"}
              sx={{
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                height: "100%",
              }}
            >
              <Skeleton
                variant="rectangular"
                width="100%"
                height={50}
                animation="wave"
                sx={{ borderRadius: "8px" }}
              />
            </Box>
          ) : errorSearchUser ? (
            <Box
              key={"errorFetchingUsers"}
              sx={{
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                height: "100%",
              }}
            >
              <p style={{ color: "#f00" }}>Error fetching users</p>
            </Box>
          ) : users.length === 0 ? (
            <Box
              key={"noUsersFound"}
              sx={{
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                height: "100%",
              }}
            >
              <p style={{ color: "#555" }}>No users found</p>
            </Box>
          ) : (
            renderedUsers
          )}
        </List>
      </Box>
    </Dialog>
  );
}
