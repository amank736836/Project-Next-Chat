"use client";

import { useEffect } from "react";
import axios from "axios";
import { useDispatch } from "react-redux";
import { server } from "../constants/config";
import { userExists, userNotExists } from "../redux/reducers/auth.reducer";

export default function UserInitializer() {
  const dispatch = useDispatch();

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const { data } = await axios.get(`${server}/user/me`, {
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
