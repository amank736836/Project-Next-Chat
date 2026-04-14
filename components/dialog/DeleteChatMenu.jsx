"use client";

import {
  Delete as DeleteIcon,
  ExitToApp as ExitToAppIcon,
} from "@mui/icons-material";
import { Menu, Stack, Typography } from "@mui/material";
import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useRouter } from "next/navigation";
import { useAsyncMutation } from "../../hooks/useHooks";
import {
  useDeleteChatMutation,
  useLeaveGroupMutation,
} from "../../redux/api/api";
import { setIsDeleteMenu } from "../../redux/reducers/misc.reducer";

export default function DeleteChatMenu({ deleteOptionAnchor }) {
  const dispatch = useDispatch();
  const router = useRouter();
  const { isDeleteMenu, selectedDeleteChat } = useSelector(
    (state) => state.misc
  );

  const isGroupChat = selectedDeleteChat.groupChat;

  const closeHandler = () => {
    dispatch(setIsDeleteMenu(false));
  };

  const [
    deleteChatMutation,
    {
      data: deleteChatData,
      isLoading: isLoadingDeleteChat,
      isError: isErrorDeleteChat,
      error: errorDeleteChat,
    },
  ] = useAsyncMutation(useDeleteChatMutation);

  const [
    leaveGroupMutation,
    {
      data: leaveGroupData,
      isLoading: isLoadingLeaveGroup,
      isError: isErrorLeaveGroup,
      error: errorLeaveGroup,
    },
  ] = useAsyncMutation(useLeaveGroupMutation);

  useEffect(() => {
    if (deleteChatData) {
      if (deleteChatData.success === "success") {
        router.push("/");
      }
    }

    if (leaveGroupData) {
      if (leaveGroupData.success === "success") {
        router.push("/");
      }
    }
  }, [deleteChatData, leaveGroupData, router]);

  const leaveGroup = () => {
    leaveGroupMutation("Leaving Group...", selectedDeleteChat.chatId);
    closeHandler();
  };

  const deleteChat = () => {
    deleteChatMutation("Deleting Chat...", selectedDeleteChat.chatId);
    closeHandler();
  };

  return (
    <Menu
      open={isDeleteMenu}
      onClose={closeHandler}
      anchorEl={deleteOptionAnchor.current}
      anchorOrigin={{
        vertical: "center",
        horizontal: "right",
      }}
      transformOrigin={{
        vertical: "center",
        horizontal: "left",
      }}
    >
      <Stack
        sx={{
          width: "10rem",
          padding: "0.5rem",
          cursor: "pointer",
        }}
        direction={"row"}
        alignItems={"center"}
        spacing={"0.5rem"}
        onClick={isGroupChat ? leaveGroup : deleteChat}
      >
        {isGroupChat ? (
          <>
            <ExitToAppIcon />
            <Typography>Leave Group</Typography>
          </>
        ) : (
          <>
            <DeleteIcon />
            <Typography>Delete Chat</Typography>
          </>
        )}
      </Stack>
    </Menu>
  );
}
