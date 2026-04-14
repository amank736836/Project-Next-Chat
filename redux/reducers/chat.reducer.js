"use client";

import { createSlice } from "@reduxjs/toolkit";
import { NEW_MESSAGE_ALERT } from "../../constants/events";

const getInitialMessagesAlert = () => {
  if (typeof window !== "undefined" && localStorage) {
    const stored = localStorage.getItem(NEW_MESSAGE_ALERT);
    return stored ? JSON.parse(stored) : null;
  }
  return null;
};

const initialState = {
  notificationCount: 0,
  newMessagesAlert: getInitialMessagesAlert() || [
    {
      chatId: "",
      count: 0,
    },
  ],
};

const chatSlice = createSlice({
  name: "chat",
  initialState,
  reducers: {
    incrementNotificationCount: (state) => {
      state.notificationCount += 1;
    },
    resetNotificationCount: (state) => {
      state.notificationCount = 0;
    },
    setNewMessagesAlert: (state, action) => {
      const { chatId } = action.payload;

      const newMessagesAlert = state.newMessagesAlert.find(
        (alert) => alert.chatId === chatId
      );
      if (newMessagesAlert) {
        newMessagesAlert.count += 1;
      } else {
        state.newMessagesAlert.push({
          chatId,
          count: 1,
        });
      }
    },
    removeNewMessagesAlert: (state, action) => {
      const chatId = action.payload;
      state.newMessagesAlert = state.newMessagesAlert.filter(
        (alert) => alert.chatId !== chatId
      );
    },
  },
});

export default chatSlice;

export const {
  incrementNotificationCount,
  resetNotificationCount,
  setNewMessagesAlert,
  removeNewMessagesAlert,
} = chatSlice.actions;
