"use client";

import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
} from "@mui/material";
import { useDispatch, useSelector } from "react-redux";
import { useRouter } from "next/navigation";
import { useAsyncMutation } from "../../hooks/useHooks";
import { useDeleteChatMutation } from "../../redux/api/api";
import { setIsDeleteMenu } from "../../redux/reducers/misc.reducer";

export default function ConfirmDeleteDialog({ chatId }) {
  const dispatch = useDispatch();
  const router = useRouter();
  const { isDeleteMenu } = useSelector((state) => state.misc);

  const handleClose = () => {
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

  const deleteHandler = () => {
    deleteChatMutation("Deleting Group...", chatId);
    router.push("/groups");
    handleClose();
  };

  return (
    <Dialog className="workspace-root" aria-labelledby="delete-group-title" open={isDeleteMenu} onClose={handleClose} maxWidth="xs" fullWidth>
      <DialogTitle id="delete-group-title" sx={{ pt: 3, px: 3 }}>Delete this group?</DialogTitle>
      <DialogContent sx={{ px: 3 }}>
        <DialogContentText>
          Are you sure you want to delete this group? This action cannot be
          undone.
        </DialogContentText>
      </DialogContent>
      <DialogActions sx={{ p: 3, pt: 1 }}>
        <Button color="inherit" onClick={handleClose}>
          Keep group
        </Button>
        <Button color="error" variant="contained" disabled={isLoadingDeleteChat} onClick={deleteHandler}>
          Delete group
        </Button>
      </DialogActions>
    </Dialog>
  );
}
