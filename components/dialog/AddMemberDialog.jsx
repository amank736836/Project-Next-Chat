"use client";

import { CloseRounded } from "@mui/icons-material";

import {
  Box,
  IconButton,
  Button,
  Dialog,
  DialogTitle,
  List,
  Skeleton,
  Stack,
  Typography,
} from "@mui/material";
import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { dialogBg } from "../../constants/color";
import { useAsyncMutation, useErrors } from "../../hooks/useHooks";
import {
  useAddMembersMutation,
  useGetAvailableFriendsQuery,
} from "../../redux/api/api";
import { setIsAddMember } from "../../redux/reducers/misc.reducer";
import UserItem from "../shared/UserItem";

export default function AddMemberDialog({ chatId }) {
  const { isAddMember } = useSelector((state) => state.misc);

  const [selectedMembers, setSelectedMembers] = useState([]);

  const dispatch = useDispatch();

  const {
    data: availableFriends,
    isLoading: isLoadingAvailableFriends,
    isError: isErrorAvailableFriends,
    error: errorAvailableFriends,
  } = useGetAvailableFriendsQuery(chatId);

  const [
    addMembers,
    {
      isLoading: isLoadingAddMember,
      isError: isErrorAddMember,
      error: errorAddMember,
    },
  ] = useAsyncMutation(useAddMembersMutation);

  useErrors([
    { isError: isErrorAddMember, error: errorAddMember },
    { isError: isErrorAvailableFriends, error: errorAvailableFriends },
  ]);

  const addMembersSubmitHandler = () => {
    addMembers("Adding Members...", {
      chatId,
      members: selectedMembers,
    });
    closeHandler();
  };

  const closeHandler = () => {
    setSelectedMembers([]);
    dispatch(setIsAddMember(false));
  };

  const selectMemberHandler = (userId) => {
    if (!userId) return;
    setSelectedMembers((prev) =>
      prev.includes(userId)
        ? prev.filter((id) => id !== userId)
        : [...prev, userId]
    );
  };

  return (
    <Dialog className="workspace-root" aria-labelledby="add-member-title" open={isAddMember} onClose={closeHandler} maxWidth="sm" fullWidth>
      <Box
        sx={{
          p: { xs: 2.5, sm: 4 },
          width: "100%",
          position: "relative",
          height: "auto",
          background: dialogBg,
        }}
      >
        <IconButton aria-label="Close dialog" onClick={closeHandler} sx={{ position: "absolute", right: 10, top: 10 }}><CloseRounded /></IconButton>
        <DialogTitle id="add-member-title" textAlign={"center"}>Add Member</DialogTitle>
        <Stack spacing={"1rem"}>
          <List
            key={"AddMemberList"}
            sx={{
              maxHeight: "400px",
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
            {isLoadingAvailableFriends ? (
              <Skeleton
                key={"AddMemberSkeleton"}
                variant="rectangular"
                width={"100%"}
                height={100}
                animation="wave"
                sx={{
                  borderRadius: "8px",
                  marginBottom: "0.5rem",
                }}
              />
            ) : isErrorAvailableFriends ? (
              <Typography textAlign={"center"} key={"AddMemberError"}>
                {errorAvailableFriends?.data?.message ||
                  errorAvailableFriends?.message ||
                  "Something went wrong"}
              </Typography>
            ) : availableFriends?.friends?.length > 0 ? (
              availableFriends?.friends?.map((user) => (
                <UserItem
                  user={user}
                  key={user._id}
                  handler={selectMemberHandler}
                  isAdded={Boolean(selectedMembers?.includes(user._id))}
                />
              ))
            ) : (
              <Typography textAlign={"center"}>No Friends Found</Typography>
            )}
          </List>
        </Stack>
        <Stack
          direction={"row"}
          justifyContent={"space-evenly"}
          alignItems={"center"}
          paddingTop={2}
          marginTop={2}
        >
          <Button color="inherit" variant="text" onClick={closeHandler}>
            Cancel
          </Button>
          <Button
            color="primary"
            variant="contained"
            disabled={isLoadingAddMember || selectedMembers.length === 0}
            onClick={addMembersSubmitHandler}
          >
            Submit Changes
          </Button>
        </Stack>
      </Box>
    </Dialog>
  );
}
