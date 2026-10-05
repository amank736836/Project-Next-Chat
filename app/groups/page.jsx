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
  Drawer,
  Grid,
  Chip,
  Paper,
  Skeleton,
  IconButton,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import {
  memo,
  useEffect,
  useState,
  lazy,
  Suspense,
  useCallback,
  useMemo,
} from "react";
import { useDispatch, useSelector } from "react-redux";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import AvatarCard from "../../components/shared/AvatarCard";
import UserItem from "../../components/shared/UserItem";
import { FullPageLoader } from "../../components/layout/Loaders";
import { useAsyncMutation, useErrors } from "../../hooks/useHooks";
import {
  useGetChatDetailsQuery,
  useGetMyGroupsQuery,
  useRemoveMemberMutation,
  useRenameGroupMutation,
} from "../../redux/api/api";
import {
  setIsAddMember,
  setIsNewGroup,
  setIsProfile,
  setIsDeleteMenu,
  setIsMobile,
} from "../../redux/reducers/misc.reducer";

const ConfirmDeleteDialog = lazy(
  () => import("../../components/dialog/ConfirmDeleteDialog"),
);

const AddMemberDialog = lazy(
  () => import("../../components/dialog/AddMemberDialog"),
);

import ProtectedRoute from "../../components/auth/ProtectedRoute";
import Header from "../../components/layout/Header";
import Profile from "../../components/shared/Profile";
import WorkspaceEmpty from "../../components/shared/WorkspaceEmpty";

function GroupsContent() {
  const { isMobile, isDeleteMenu, isAddMember, isProfile } = useSelector(
    (state) => state.misc,
  );

  const router = useRouter();
  const searchParams = useSearchParams();
  const dispatch = useDispatch();

  const chatId = searchParams.get("group");

  const [groupName, setGroupName] = useState("Group Details Page");
  const [groupNameUpdatedValue, setGroupNameUpdatedValue] =
    useState("Group Details Page");
  const [isEdit, setIsEdit] = useState(false);
  const [members, setMembers] = useState([]);

  const {
    data: myGroups = [],
    isLoading: isLoadingMyGroups,
    isError: isErrorMyGroups,
    error: errorMyGroups,
  } = useGetMyGroupsQuery("");

  const {
    currentData: groupDetails,
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
  const handleMobileOpen = useCallback(
    () => dispatch(setIsMobile(true)),
    [dispatch],
  );
  const handleMobileClose = useCallback(
    () => dispatch(setIsMobile(false)),
    [dispatch],
  );
  const openAddMemberHandler = useCallback(
    () => dispatch(setIsAddMember(true)),
    [dispatch],
  );
  const openConfirmDeleteHandler = useCallback(
    () => dispatch(setIsDeleteMenu(true)),
    [dispatch],
  );

  const updateGroupName = useCallback(() => {
    setIsEdit(false);
    if (groupName === groupNameUpdatedValue) return;
    setGroupName(groupNameUpdatedValue.trim());
    updateGroupNameMutation("Updating group name...", {
      chatId,
      name: groupNameUpdatedValue.trim(),
    });
  }, [chatId, groupName, groupNameUpdatedValue, updateGroupNameMutation]);

  const removeMemberHandler = useCallback(
    async (memberId) => {
      if (memberId === groupDetails.chat.creator) return;
      removeMemberMutation("Removing member...", {
        chatId,
        memberId,
      });
    },
    [chatId, groupDetails?.chat?.creator, removeMemberMutation],
  );

  useEffect(() => {
    if (groupDetails) {
      setGroupName(groupDetails.chat.name);
      setGroupNameUpdatedValue(groupDetails.chat.name);
      setMembers(
        groupDetails.chat.members.map((member) => ({
          ...member,
          isAdded: true,
        })),
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
  const shouldShowIntro =
    !chatId || !groupDetails?.chat || isLoadingGroupDetails;

  return (
    <Grid
      className="workspace-root"
      container
      sx={{ minHeight: "calc(100dvh - 64px)" }}
    >
      <Grid
        size={{ sm: 4, md: 3 }}
        sx={{
          display: { xs: "none", sm: "block" },
          bgcolor: "white",
          borderRight: "1px solid #e7ecf4",
          height: "calc(100dvh - 64px)",
          overflowY: "auto",
        }}
      >
        <GroupsList
          myGroups={groupsList}
          chatId={chatId}
          loading={isLoadingMyGroups}
        />
      </Grid>
      <Grid
        size={{ xs: 12, sm: 8, md: 9 }}
        sx={{ p: { xs: 2, md: 4 }, minWidth: 0 }}
      >
        <Stack
          direction="row"
          justifyContent="space-between"
          alignItems="center"
          sx={{ mb: 3 }}
        >
          <Button
            startIcon={<KeyboardBackspaceIcon />}
            onClick={navigateBack}
            color="inherit"
          >
            Back to messages
          </Button>
          <Button
            onClick={handleMobileOpen}
            variant="outlined"
            sx={{ display: { xs: "inline-flex", sm: "none" } }}
          >
            Your groups
          </Button>
          <Chip
            label="GROUP WORKSPACE"
            size="small"
            sx={{
              display: { xs: "none", sm: "flex" },
              fontSize: 10,
              letterSpacing: ".1em",
              bgcolor: "#e9eefb",
              color: "primary.main",
            }}
          />
        </Stack>
        {shouldShowIntro ? (
          isLoadingGroupDetails || isLoadingMyGroups ? (
            <Stack spacing={2} aria-label="Loading groups">
              <Skeleton height={120} variant="rounded" />
              <Skeleton height={260} variant="rounded" />
            </Stack>
          ) : (
            <Box sx={{ display: "flex", minHeight: "65vh" }}>
              <WorkspaceEmpty
                eyebrow="BETTER, TOGETHER"
                title="A place for your people."
                description="Bring your favorite people into one conversation. Select a group to manage its members, or make room for a new one."
              >
                <Button
                  variant="contained"
                  startIcon={<AddIcon />}
                  onClick={() => dispatch(setIsNewGroup(true))}
                >
                  Create a group
                </Button>
              </WorkspaceEmpty>
            </Box>
          )
        ) : (
          <Stack
            key={chatId}
            className="workspace-reveal"
            spacing={3}
            sx={{ maxWidth: 920, mx: "auto" }}
          >
            <Paper
              elevation={0}
              sx={{
                p: { xs: 2.5, md: 4 },
                border: "1px solid #e7ecf4",
                borderRadius: 4,
                background: "linear-gradient(120deg, #fff 55%, #edf1ff)",
              }}
            >
              <Typography
                variant="overline"
                color="primary"
                sx={{ letterSpacing: ".12em" }}
              >
                Your group
              </Typography>
              {isEdit ? (
                <Stack
                  component="form"
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (groupNameUpdatedValue.trim()) updateGroupName();
                  }}
                  direction="row"
                  useFlexGap
                  flexWrap="wrap"
                  gap={1}
                  sx={{ mt: 1 }}
                >
                  <TextField
                    autoFocus
                    label="Group name"
                    size="small"
                    value={groupNameUpdatedValue}
                    onChange={(e) => setGroupNameUpdatedValue(e.target.value)}
                    sx={{ flex: 1, minWidth: 160 }}
                  />
                  <IconButton
                    aria-label="Save group name"
                    type="submit"
                    color="primary"
                    disabled={
                      isLoadingUpdateGroupName || !groupNameUpdatedValue.trim()
                    }
                  >
                    <DoneIcon />
                  </IconButton>
                  <Button
                    onClick={() => {
                      setIsEdit(false);
                      setGroupNameUpdatedValue(groupName);
                    }}
                  >
                    Cancel
                  </Button>
                </Stack>
              ) : (
                <Stack
                  direction="row"
                  gap={1}
                  alignItems="center"
                  sx={{ mt: 0.5 }}
                >
                  <Typography
                    component="h1"
                    variant="h4"
                    sx={{ overflowWrap: "anywhere", minWidth: 0 }}
                  >
                    {groupName}
                  </Typography>
                  <Tooltip title="Rename group">
                    <IconButton
                      aria-label="Rename group"
                      onClick={() => setIsEdit(true)}
                      disabled={isLoadingUpdateGroupName}
                    >
                      <EditIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </Stack>
              )}
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                {members.length} {members.length === 1 ? "member" : "members"} ·
                A shared space to stay connected
              </Typography>
              <Button
                component={Link}
                href={`/chat/${chatId}`}
                variant="outlined"
                sx={{ mt: 2.5, bgcolor: "white" }}
              >
                Open conversation
              </Button>
            </Paper>
            <Paper
              elevation={0}
              sx={{
                border: "1px solid #e7ecf4",
                borderRadius: 4,
                overflow: "hidden",
              }}
            >
              <Stack
                direction="row"
                justifyContent="space-between"
                alignItems="center"
                gap={1}
                sx={{ p: { xs: 2, md: 3 }, borderBottom: "1px solid #e7ecf4" }}
              >
                <Box>
                  <Typography component="h2" variant="h6">
                    Members{" "}
                    <Box
                      component="span"
                      sx={{ color: "text.secondary", fontSize: 14, ml: 1 }}
                    >
                      {members.length}
                    </Box>
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    The people in this conversation.
                  </Typography>
                </Box>
                <Button
                  variant="contained"
                  startIcon={<AddIcon />}
                  onClick={openAddMemberHandler}
                  sx={{ flexShrink: 0 }}
                >
                  Add member
                </Button>
              </Stack>
              <Stack
                component="ul"
                sx={{
                  p: { xs: 1, md: 2 },
                  maxHeight: "45vh",
                  overflowY: "auto",
                  listStyle: "none",
                }}
                aria-busy={isLoadingRemoveMember}
              >
                {members.length === 0 ? (
                  <Typography
                    sx={{ p: 3, textAlign: "center" }}
                    color="text.secondary"
                  >
                    No members found in this group.
                  </Typography>
                ) : (
                  members.map((member) => (
                    <UserItem
                      key={member._id}
                      user={member}
                      isAdded={member.isAdded}
                      handler={removeMemberHandler}
                      handlerIsLoading={
                        isLoadingRemoveMember ||
                        member._id === groupDetails.chat.creator
                      }
                      styling={{ p: 1.5, borderRadius: 2, bgcolor: "#f7f9fd" }}
                    />
                  ))
                )}
              </Stack>
            </Paper>
            <Stack
              direction={{ xs: "column", sm: "row" }}
              alignItems={{ xs: "flex-start", sm: "center" }}
              justifyContent="space-between"
              gap={2}
              sx={{ p: 2.5, border: "1px solid #ecdde1", borderRadius: 3 }}
            >
              <Box>
                <Typography fontWeight={650} fontSize={14}>
                  Delete this group
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  This permanently removes the group and its conversations.
                </Typography>
              </Box>
              <Button
                color="error"
                variant="outlined"
                startIcon={<DeleteIcon />}
                onClick={openConfirmDeleteHandler}
                sx={{ flexShrink: 0 }}
              >
                Delete group
              </Button>
            </Stack>
          </Stack>
        )}
      </Grid>
      {isAddMember && (
        <Suspense fallback={<Backdrop open />}>
          <AddMemberDialog chatId={chatId} />
        </Suspense>
      )}
      {isDeleteMenu && (
        <Suspense fallback={<Backdrop open />}>
          <ConfirmDeleteDialog chatId={chatId} />
        </Suspense>
      )}
      <Drawer
        anchor="right"
        open={isProfile}
        onClose={() => dispatch(setIsProfile(false))}
        slotProps={{ paper: { sx: { width: "min(85vw, 360px)" } } }}
      >
        <Profile />
      </Drawer>
      <Drawer
        anchor="left"
        open={isMobile}
        onClose={handleMobileClose}
        slotProps={{ paper: { sx: { width: "min(85vw, 360px)" } } }}
      >
        <GroupsList
          myGroups={groupsList}
          chatId={chatId}
          loading={isLoadingMyGroups}
        />
      </Drawer>
    </Grid>
  );
}

const GroupsList = memo(({ myGroups = [], chatId, loading }) => {
  const dispatch = useDispatch();
  return (
    <Stack
      className="workspace-root"
      sx={{ p: 2.5, bgcolor: "white", minHeight: "100%" }}
      spacing={1}
    >
      <Stack
        direction="row"
        alignItems="center"
        justifyContent="space-between"
        sx={{ mb: 1 }}
      >
        <Typography component="h2" variant="h6">
          Your groups
        </Typography>
        <Chip
          size="small"
          label={myGroups.length}
          sx={{ bgcolor: "#edf1ff", color: "primary.main" }}
        />
      </Stack>
      <Typography variant="body2" color="text.secondary" sx={{ pb: 2 }}>
        Good company, all in one place.
      </Typography>
      <Button
        variant="outlined"
        startIcon={<AddIcon />}
        onClick={() => {
          dispatch(setIsMobile(false));
          dispatch(setIsNewGroup(true));
        }}
        sx={{ mb: "20px !important" }}
      >
        Create a group
      </Button>
      {loading ? (
        <Skeleton variant="rounded" height={160} />
      ) : myGroups.length ? (
        myGroups.map((group) => (
          <Link
            key={group._id}
            href={`?group=${group._id}`}
            className="chat-list-link"
            aria-current={chatId === group._id ? "page" : undefined}
            onClick={() => dispatch(setIsMobile(false))}
          >
            <Stack
              direction="row"
              gap={1.5}
              alignItems="center"
              sx={{ p: 1.5 }}
            >
              <AvatarCard avatar={group.avatar} />
              <Box sx={{ minWidth: 0 }}>
                <Typography fontWeight={650} fontSize={14} noWrap>
                  {group.name}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Manage group
                </Typography>
              </Box>
            </Stack>
          </Link>
        ))
      ) : (
        <Typography
          variant="body2"
          color="text.secondary"
          sx={{ p: 2, textAlign: "center" }}
        >
          No groups yet. Start one with your friends.
        </Typography>
      )}
    </Stack>
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
