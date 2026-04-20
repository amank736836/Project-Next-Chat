"use client";

import { useEffect } from "react";
import axios from "axios";
import { useDispatch } from "react-redux";
import { userExists, userNotExists } from "../redux/reducers/auth.reducer";

const AUTH_API_BASE = "/api/v1/user";

export default function UserInitializer() {
  const dispatch = useDispatch();

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const { data } = await axios.get(`${AUTH_API_BASE}/me`, {
          withCredentials: true,
        });
        dispatch(userExists(data.user));
      } catch (error) {
        dispatch(userNotExists());
      }
    };

    fetchUser();
  }, [dispatch]);

  return null;
}
