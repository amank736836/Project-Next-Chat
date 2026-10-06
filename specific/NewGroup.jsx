"use client";

import { useInputValidation } from "6pp";
import {
  Box,
  Button,
  Dialog,
  DialogTitle,
  Skeleton,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { useCallback, useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { useDispatch, useSelector } from "react-redux";
import UserItem from "../components/shared/UserItem";
import { dialogBg } from "../constants/color";
import { useAsyncMutation, useErrors } from "../hooks/useHooks";
import {
  useGetAvailableFriendsQuery,
  useNewGroupMutation,
} from "../redux/api/api";
import { setIsNewGroup } from "../redux/reducers/misc.reducer";

export default function NewGroupDialog() {
  const { isNewGroup } = useSelector((state) => state.misc);

  const groupName = useInputValidation("");

  const [members, setMembers] = useState([]);
  const [selectedMembers, setSelectedMembers] = useState([]);

  const dispatch = useDispatch();

  const {
    data: availableFriends,
    isLoading: loadingAvailableFriends,
    isError: errorAvailableFriends,
    error: errorAvailableFriendsMessage,
  } = useGetAvailableFriendsQuery("");

  const [
    newGroup,
    {
      isLoading: loadingNewGroup,
      isError: errorNewGroup,
      error: errorNewGroupMessage,
    },
  ] = useAsyncMutation(useNewGroupMutation);

  useErrors([
    {
      isError: errorAvailableFriends,
      error: errorAvailableFriendsMessage,
    },
    {
      isError: errorNewGroup,
      error: errorNewGroupMessage,
    },
  ]);

  const closeGroupHandler = useCallback(() => {
    setSelectedMembers([]);
    dispatch(setIsNewGroup(false));
  }, [dispatch]);

  const submitHandler = useCallback(() => {
    if (!groupName.value.trim()) return toast.error("Group name is required");
    if (selectedMembers.length < 1) {
      return toast.error("Select at least one member");
    }

    newGroup("Creating new group...", {
      name: groupName.value.trim(),
      otherMembers: selectedMembers,
    });

    closeGroupHandler();
  }, [groupName.value, selectedMembers, newGroup, closeGroupHandler]);

  const selectMemberHandler = useCallback((userId) => {
    if (!userId) return;
    setSelectedMembers((prev) =>
      prev.includes(userId)
        ? prev.filter((id) => id !== userId)
        : [...prev, userId]
    );
    setMembers((prev) =>
      prev.map((user) =>
        user._id === userId ? { ...user, isAdded: !user.isAdded } : user
      )
    );
  }, []);

  useEffect(() => {
    if (availableFriends?.friends?.length > 0) {
      setMembers(
        availableFriends.friends?.map((user) => ({ ...user, isAdded: false }))
      );
    }
  }, [availableFriends]);

  const renderedMembers = useMemo(
    () =>
      members.map((user) => (
        <UserItem
          user={user}
          key={user._id}
          handler={selectMemberHandler}
          isAdded={Boolean(user.isAdded)}
        />
      )),
    [members, selectMemberHandler]
  );

  return (
    <Dialog className="workspace-root" aria-labelledby="new-group-title" open={isNewGroup} onClose={closeGroupHandler} maxWidth="sm" fullWidth>
      <Box
        sx={{
          p: { xs: "1.5rem", sm: "3rem" },
          width: "100%",
          borderRadius: "12px",
          background: dialogBg,
        }}
      >
        <DialogTitle id="new-group-title" sx={{ px: 0, pt: 0, pb: 3 }} variant="h5" fontWeight={700}>
          Create a New Group
        </DialogTitle>

        <TextField
          value={groupName.value}
          onChange={groupName.changeHandler}
          label="Group Name"
          variant="outlined"
          size="medium"
          sx={{
            width: "100%",
            bgcolor: "white",
            borderRadius: "8px",
          }}
        />

        <Typography variant="body1" fontWeight={500} mt={2}>
          Choose your people · {selectedMembers.length} selected
        </Typography>

        <Stack
          component="ul"
          sx={{
            listStyle: "none",
            maxHeight: "200px",
            overflowY: "auto",
            borderRadius: "8px",
            backgroundColor: "white",
            p: "0.5rem",
            mt: "1rem",
            "&::-webkit-scrollbar": {
              display: "none",
            },
          }}
        >
          {loadingAvailableFriends ? (
            <Skeleton variant="rounded" height={40} />
          ) : errorAvailableFriends ? (
            <Typography variant="body2" color="error" textAlign="center">
              {errorAvailableFriendsMessage?.data?.message || "Unable to load friends. Please try again."}
            </Typography>
          ) : availableFriends?.friends?.length === 0 ? (
            <Typography variant="body2" textAlign="center">
              No available friends to add.
            </Typography>
          ) : (
            renderedMembers
          )}
        </Stack>

        <Stack direction="row" justifyContent="space-between" mt={3}>
          <Button
            variant="text"
            color="inherit"
            size="large"
            onClick={closeGroupHandler}
            sx={{ borderRadius: "8px", fontWeight: 600 }}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            color="primary"
            size="large"
            sx={{
              bgcolor: "primary.main",
              "&:hover": { bgcolor: "primary.dark" },
              "&:disabled": { bgcolor: "#d3d3d3", color: "#777" },
              borderRadius: "8px",
              fontWeight: 600,
            }}
            onClick={submitHandler}
            disabled={groupName.value.trim().length < 1 || selectedMembers.length < 1}
          >
            Create Group
          </Button>
        </Stack>
      </Box>
    </Dialog>
  );
}
