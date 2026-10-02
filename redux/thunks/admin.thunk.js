"use client";

import { createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";

const ADMIN_API_BASE = "/api/v1/admin";

const adminLogin = createAsyncThunk("admin/login", async (secretKey) => {
  const config = {
    headers: {
      "Content-Type": "application/json",
    },
    withCredentials: true,
  };
  try {
    const { data } = await axios.post(
      `${ADMIN_API_BASE}/verify`,
      { secretKey },
      config
    );
    return data;
  } catch (error) {
    throw new Error(error?.response?.data?.message || "Unable to sign in. Please try again.");
  }
});

const getAdmin = createAsyncThunk("admin/getAdmin", async () => {
  const config = {
    headers: {
      "Content-Type": "application/json",
    },
    withCredentials: true,
  };
  try {
    const { data } = await axios.get(`${ADMIN_API_BASE}`, config);
    return data;
  } catch (error) {
    throw new Error(error?.response?.data?.message || "Unable to verify the admin session.");
  }
});

const adminLogout = createAsyncThunk("admin/logout", async () => {
  const config = {
    headers: {
      "Content-Type": "application/json",
    },
    withCredentials: true,
  };
  try {
    const { data } = await axios.get(`${ADMIN_API_BASE}/logout`, config);
    return data;
  } catch (error) {
    throw new Error(error?.response?.data?.message || "Unable to log out. Please try again.");
  }
});

export { adminLogin, adminLogout, getAdmin };
