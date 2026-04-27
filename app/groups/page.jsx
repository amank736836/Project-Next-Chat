"use client";

import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Done as DoneIcon,
  Edit as EditIcon,
  KeyboardBackspace as KeyboardBackspaceIcon,
} from "@mui/icons-material";
import {
  Backdrop,
  Box,
  Button,
  CircularProgress,
  Drawer,
  Grid,
  IconButton,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import { memo, useEffect, useState, lazy, Suspense, useCallback, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import AvatarCard from "../../components/shared/AvatarCard";
import UserItem from "../../components/shared/UserItem";
import { FullPageLoader } from "../../components/layout/Loaders";
import { gradientBg } from "../../constants/color";
import { useAsyncMutation, useErrors } from "../../hooks/useHooks";
import {
  useGetChatDetailsQuery,
  useGetMyGroupsQuery,
  useRemoveMemberMutation,
  useRenameGroupMutation,
} from "../../redux/api/api";
import {
  setIsAddMember,
  setIsDeleteMenu,
  setIsMobile,
} from "../../redux/reducers/misc.reducer";

const ConfirmDeleteDialog = lazy(() =>
  import("../../components/dialog/ConfirmDeleteDialog")
);

const AddMemberDialog = lazy(() =>
  import("../../components/dialog/AddMemberDialog")
);

import ProtectedRoute from "../../components/auth/ProtectedRoute";
import Header from "../../components/layout/Header";

function GroupsContent() {
  const { isMobile, isDeleteMenu, isAddMember } = useSelector(
    (state) => state.misc
  );

  const router = useRouter();
  const searchParams = useSearchParams();
  const dispatch = useDispatch();

  const chatId = searchParams.get("group");

  const [groupName, setGroupName] = useState("Group Details Page");
  const [groupNameUpdatedValue, setGroupNameUpdatedValue] = useState("Group Details Page");
  const [isEdit, setIsEdit] = useState(false);
  const [members, setMembers] = useState([]);

  const {
    data: myGroups = [],
    isLoading: isLoadingMyGroups,
    isError: isErrorMyGroups,
    error: errorMyGroups,
  } = useGetMyGroupsQuery("");

  const {
    data: groupDetails,
    isLoading: isLoadingGroupDetails,
    isError: isErrorGroupDetails,
    error: errorGroupDetails,
  } = useGetChatDetailsQuery({ chatId, populate: true }, { skip: !chatId });

  const [
    updateGroupNameMutation,
    {
      isLoading: isLoadingUpdateGroupName,
      isError: isErrorUpdateGroupName,
      error: errorUpdateGroupName,
    },
  ] = useAsyncMutation(useRenameGroupMutation);

  const [
    removeMemberMutation,
    {
      isLoading: isLoadingRemoveMember,
      isError: isErrorRemoveMember,
      error: errorRemoveMember,
    },
  ] = useAsyncMutation(useRemoveMemberMutation);

  useErrors([
    { isError: isErrorMyGroups, error: errorMyGroups },
    { isError: isErrorGroupDetails, error: errorGroupDetails },
    { isError: isErrorUpdateGroupName, error: errorUpdateGroupName },
    { isError: isErrorRemoveMember, error: errorRemoveMember },
  ]);

  const navigateBack = useCallback(() => router.push("/"), [router]);
  const handleMobileOpen = useCallback(() => dispatch(setIsMobile(true)), [dispatch]);
  const handleMobileClose = useCallback(() => dispatch(setIsMobile(false)), [dispatch]);
  const openAddMemberHandler = useCallback(() => dispatch(setIsAddMember(true)), [dispatch]);
  const openConfirmDeleteHandler = useCallback(() => dispatch(setIsDeleteMenu(true)), [dispatch]);

  const updateGroupName = useCallback(() => {
    setIsEdit(false);
    if (groupName === groupNameUpdatedValue) return;
    setGroupName(groupNameUpdatedValue);
    updateGroupNameMutation("Updating group name...", {
      chatId,
      name: groupNameUpdatedValue,
    });
  }, [chatId, groupName, groupNameUpdatedValue, updateGroupNameMutation]);

  const removeMemberHandler = useCallback(async (memberId) => {
    if (memberId === groupDetails.chat.creator) return;
    removeMemberMutation("Removing member...", {
      chatId,
      memberId,
    });
  }, [chatId, groupDetails?.chat?.creator, removeMemberMutation]);

  useEffect(() => {
    if (groupDetails) {
      setGroupName(groupDetails.chat.name);
      setGroupNameUpdatedValue(groupDetails.chat.name);
      setMembers(
        groupDetails.chat.members.map((member) => ({
          ...member,
          isAdded: true,
        }))
      );
      setIsEdit(false);
    }
    if (isErrorGroupDetails) {
      router.push("/groups");
    }
  }, [groupDetails, isErrorGroupDetails, router]);

  useEffect(() => {
    return () => {
      setGroupName("");
      setGroupNameUpdatedValue("");
      setMembers([]);
      setIsEdit(false);
    };
  }, [chatId]);

  const groupsList = useMemo(() => myGroups?.groups || [], [myGroups?.groups]);
  const shouldShowIntro = !chatId || !groupDetails?.chat || isLoadingGroupDetails;

  const BackButtonToolbar = (
    <Box
      sx={{
          position: "absolute",
          top: "2rem",
          right: "2rem",
      }}
    >
      <Tooltip title="Back">
        <IconButton
          onClick={navigateBack}
          sx={{
            color: "white",
            transition: "all 0.3s ease-in-out",
            "&:hover": {
              backgroundColor: "rgba(255, 255, 255, 0.2)",
              transform: "scale(1.1)",
            },
          }}
        >
          <KeyboardBackspaceIcon />
        </IconButton>
      </Tooltip>
    </Box>
  );

  const GroupName = (
    <Stack
      width={"100%"}
      direction={"row"}
      alignItems={"center"}
      justifyContent={"center"}
      spacing={"1rem"}
      padding={"3rem"}
    >
      {isEdit ? (
        <>
          <TextField
            variant="outlined"
            value={groupNameUpdatedValue}
            onChange={(e) => setGroupNameUpdatedValue(e.target.value)}
          />
          <IconButton
            onClick={updateGroupName}
            disabled={isLoadingUpdateGroupName}
          >
            <DoneIcon />
          </IconButton>
        </>
      ) : (
        <>
          <Typography variant="h4">{groupName}</Typography>
          {chatId && (
            <IconButton
              onClick={() => setIsEdit(true)}
              disabled={isLoadingUpdateGroupName}
            >
              <EditIcon />
            </IconButton>
          )}
        </>
      )}
    </Stack>
  );

  const ButtonGroup = (
    <Stack
      direction={{
        xs: "column-reverse",
        sm: "row",
      }}
      spacing={"1rem"}
      p={{
        xs: "0",
        sm: "1rem",
        md: "1rem 4rem",
      }}
    >
      <Button
        size="large"
        color="error"
        variant="contained"
        startIcon={<DeleteIcon />}
        onClick={openConfirmDeleteHandler}
      >
        Delete Group
      </Button>
      <Button
        size="large"
        variant="contained"
        startIcon={<AddIcon />}
        onClick={openAddMemberHandler}
      >
        Add Member
      </Button>
    </Stack>
  );

  return isLoadingMyGroups ? (
    <Grid
      container
      height={{ xs: "calc(100vh - 56px)", sm: "calc(100vh - 64px)" }}
    >
      <Grid size={12}>
        <FullPageLoader minHeight="100%" />
      </Grid>
    </Grid>
  ) : (
    <Grid
      container
      height={{ xs: "calc(100vh - 56px)", sm: "calc(100vh - 64px)" }}
    >
      <Grid
        size={{ sm: 4 }}
        sx={{
          display: { xs: "none", sm: "block" },
          background: gradientBg,
          boxShadow: "2px 0 10px rgba(0,0,0,0.1)",
          padding: "0.5rem",
          "&::-webkit-scrollbar": {
            display: "none",
          },
        }}
        width={"100%"}
        height={"100%"}
        position={"relative"}
        overflow={"auto"}
      >
        <GroupsList myGroups={groupsList} chatId={chatId} />
      </Grid>

      <Grid
        size={{ xs: 12, sm: 8 }}
        sx={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          position: "relative",
          padding: "0 0 1.5rem 0",
          background: gradientBg,
          color: "white",
        }}
      >
        {BackButtonToolbar}

        {groupName && (
          <>
            {GroupName}

            <Typography
              margin={"2rem"}
              alignSelf={"flex-start"}
              variant="body1"
            >
              Members
            </Typography>
            <Stack
              maxWidth={"45rem"}
              width={"100%"}
              boxSizing={"border-box"}
              padding={{
                xs: "0",
                sm: "1rem",
                md: "1rem 4rem",
              }}
              spacing={"2rem"}
              bgcolor={gradientBg}
              height={"50vh"}
              overflow={"auto"}
              sx={{
                "&::-webkit-scrollbar": {
                  display: "none",
                },
              }}
            >
              {shouldShowIntro && (
                <Typography
                  variant="body2"
                  color="white"
                  fontSize={"3rem"}
                  marginLeft={"1rem"}
                  fontWeight={600}
                  sx={{
                    display: "inline-block",
                    backgroundColor: "rgba(255, 255, 255, 0.2)",
                    padding: "0.5rem",
                    borderRadius: "1rem",
                  }}
                >
                  Here members can be added or removed from the group. Select a
                  group to view its details.
                </Typography>
              )}
              {groupDetails && members.length === 0 ? (
                <Typography textAlign="center" color="white">
                  No members found in this group.
                </Typography>
              ) : (
                <Stack
                  spacing={0.5}
                  sx={{
                    "&::-webkit-scrollbar": {
                      display: "none",
                    },
                  }}
                >
                  <>
                    {isLoadingRemoveMember ? (
                      <>
                        <CircularProgress
                          size={20}
                          sx={{
                            color: "white",
                            position: "absolute",
                            top: "50%",
                            left: "50%",
                            transform: "translate(-50%, -50%)",
                          }}
                        />
                      </>
                    ) : (
                      members.map((user) => (
                        <UserItem
                          key={user._id}
                          user={user}
                          isAdded={user.isAdded}
                          handler={removeMemberHandler}
                          styling={{
                            boxShadow: "0 0 0.5rem rgba(0, 0, 0, 0.2)",
                            padding: "1rem 2rem",
                            borderRadius: "1rem",
                            bgcolor: "rgba(25, 25, 25, 0.5)",
                          }}
                        />
                      ))
                    )}
                  </>
                </Stack>
              )}
            </Stack>

            {chatId && ButtonGroup}
          </>
        )}
      </Grid>

      {isAddMember && (
        <Suspense fallback={<Backdrop open={true} />}>
          <AddMemberDialog chatId={chatId} />
        </Suspense>
      )}

      {isDeleteMenu && (
        <Suspense fallback={<Backdrop open={true} />}>
          <ConfirmDeleteDialog chatId={chatId} />
        </Suspense>
      )}

      <Drawer
        anchor="left"
        open={isMobile}
        onClose={handleMobileClose}
        sx={{
          display: { xs: "block", sm: "none" },
        }}
        slotProps={{
          paper: {
            sx: { width: "75vw", background: gradientBg, padding: "0.5rem" },
          },
        }}
      >
        <GroupsList w={"70vw"} myGroups={groupsList} chatId={chatId} />
      </Drawer>
    </Grid>
  );
}

const GroupsList = memo(({ w = "100%", myGroups = [], chatId }) => {
  const renderedGroups = useMemo(
    () =>
      myGroups.map((group) => (
        <GroupListItem group={group} key={group._id} chatId={chatId} />
      )),
    [myGroups, chatId]
  );

  return (
    <Stack sx={{ padding: "0.25rem" }} width={w} height={"100%"}>
      {myGroups.length > 0 ? (
        renderedGroups
      ) : (
        <Typography textAlign="center" padding="1rem" color="white">
          No Groups Found
        </Typography>
      )}
    </Stack>
  );
});

const GroupListItem = memo(({ group, chatId }) => {
  const { name, avatar, _id } = group;

  const dispatch = useDispatch();
  const handleMobileClose = useCallback(
    () => dispatch(setIsMobile(false)),
    [dispatch]
  );

  return (
    <Link
      href={`?group=${_id}`}
      onClick={(e) => {
        if (chatId === _id) e.preventDefault();
        handleMobileClose();
      }}
      style={{
        textDecoration: "none",
        color: "#333",
        padding: "0.5rem",
        fontWeight: "bold",
        borderRadius: "8px",
        transition: "all 0.3s ease-in-out",
        display: "inline-block",
        width: "100%",
      }}
    >
      <Stack
        direction="row"
        spacing={3}
        sx={{
          display: "flex",
          alignItems: "center",
          gap: "1rem",
          padding: "0.5rem",
          paddingLeft: "1rem",
          borderRadius: "0.75rem",
          backgroundColor: "rgba(255, 255, 255, 0.2)",
          transition: "background-color 0.3s ease, transform 0.2s ease",
          "&:hover": {
            backgroundColor: "rgba(255, 255, 255, 0.3)",
            transform: "scale(1.05)",
          },
        }}
      >
        <AvatarCard avatar={avatar} />
        <Typography fontSize="1rem" fontWeight="500" color="white">
          {name}
        </Typography>
      </Stack>
    </Link>
  );
});

export default function Groups() {
  return (
    <ProtectedRoute>
      <>
        <Header />
        <Suspense fallback={<FullPageLoader minHeight="90vh" />}>
          <GroupsContent />
        </Suspense>
      </>
    </ProtectedRoute>
  );
}
