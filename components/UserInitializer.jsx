"use client";

import { useEffect } from "react";
import axios from "axios";
import { useDispatch } from "react-redux";
import { usePathname } from "next/navigation";
import { userExists, userNotExists } from "../redux/reducers/auth.reducer";

const AUTH_API_BASE = "/api/v1/user";
const PUBLIC_PATHS = new Set([
  "/login",
  "/forgot",
  "/verify",
  "/admin/login",
  "/admin/forgot",
]);

export default function UserInitializer() {
  const dispatch = useDispatch();
  const pathname = usePathname();

  useEffect(() => {
    if (!pathname) return;

    if (PUBLIC_PATHS.has(pathname) || pathname.startsWith("/u/")) {
      dispatch(userNotExists());
      return;
    }

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
  }, [dispatch, pathname]);

  return null;
}
