"use client";

import { authApiBase as AUTH_API_BASE } from "../../constants/config";

import {
  AccountCircle as AccountCircleIcon,
  Add as AddIcon,
  Close as CloseIcon,
  Forum as ForumIcon,
  Group as GroupIcon,
  Logout as LogoutIcon,
  Menu as MenuIcon,
  Notifications as NotificationsIcon,
  Search as SearchIcon,
} from "@mui/icons-material";
import {
  AppBar,
  Backdrop,
  Badge,
  Box,
  IconButton,
  Toolbar,
  Tooltip,
  Typography,
} from "@mui/material";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import axios from "axios";
import { useState, lazy, Suspense } from "react";
import toast from "react-hot-toast";
import { useDispatch, useSelector } from "react-redux";
import { userNotExists } from "../../redux/reducers/auth.reducer";
import {
  resetNotificationCount,
  setNotificationCount,
} from "../../redux/reducers/chat.reducer";
import {
  setIsMobile,
  setIsNewGroup,
  setIsNotification,
  setIsProfile,
  setIsSearch,
} from "../../redux/reducers/misc.reducer";
import { useRouter } from "next/navigation";

const SearchDialog = lazy(() => import("../../specific/Search"));
const NotificationsDialog = lazy(() => import("../../specific/Notifications"));
const NewGroupDialog = lazy(() => import("../../specific/NewGroup"));

export default function Header() {
  const dispatch = useDispatch();
  const router = useRouter();
  const pathname = usePathname();

  const { isMobile, isSearch, isNotification, isNewGroup, isProfile } =
    useSelector((state) => state.misc);
  const { user } = useSelector((state) => state.auth);

  const { notificationCount } = useSelector((state) => state.chat);

  const openMobile = () => {
    dispatch(setIsMobile(true));
  };

  const openSearch = () => {
    dispatch(setIsSearch(true));
  };

  const openNotification = () => {
    dispatch(setIsNotification(true));
    dispatch(resetNotificationCount());
  };

  const openNewGroup = () => {
    dispatch(setIsNewGroup(true));
  };

  const openProfile = () => {
    dispatch(setIsProfile(true));
  };

  const logoutHandler = async () => {
    let toastId = toast.loading("Logging out...");

    try {
      const { data } = await axios.get(`${AUTH_API_BASE}/logout`, {
        withCredentials: true,
      });

      dispatch(userNotExists());
      dispatch(setNotificationCount(0));

      toast.success(data.message, {
        duration: 1000,
        id: toastId,
      });
    } catch (error) {
      console.error(error);
      toast.error(error?.response?.data?.message || "Something went wrong!", {
        duration: 1000,
        id: toastId,
      });
    }
  };

  return (
    <>
      <AppBar
        position="sticky"
        sx={{
          top: 0,
          zIndex: (theme) => theme.zIndex.appBar,
          bgcolor: "#ffffff",
          color: "#202b45",
          borderBottom: "1px solid #e7ecf4",
          boxShadow: "none",
        }}
      >
        <Toolbar className="workspace-root" sx={{ minHeight: "64px !important", bgcolor: "white", px: { xs: 1, sm: 3 }, gap: { xs: 0, sm: 1 } }}>
          <Box
            component={Link}
            href="/"
            aria-label="Chat Champ home"
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 1,
              cursor: "pointer",
              color: "inherit",
              textDecoration: "none",
              transition: "opacity 0.3s",
              "&:hover": { opacity: 0.9 },
            }}
          >
            <Image
              src="/logo.svg"
              alt="Chat Champ logo"
              width={32}
              height={32}
              priority
            />
            <Typography
              variant="h6"
              sx={{
                display: { xs: "none", sm: "block" },
                fontWeight: 700,
                letterSpacing: "0.3px",
              }}
            >
              Chat Champ
            </Typography>
          </Box>

          <Box sx={{ display: { xs: "block", sm: "none" } }}>
            <IconButton aria-label="Open conversations" color="inherit" onClick={openMobile}>
              {isMobile ? <CloseIcon /> : <MenuIcon />}
            </IconButton>
          </Box>

          <Box sx={{ flexGrow: 1 }} />

          <Box display="flex" gap={{ xs: 0, sm: 0.5 }}>
            <IconBtn
              title="Search"
              onClick={openSearch}
              icon={<SearchIcon />}
            />
            <IconBtn
              title="New Group"
              onClick={openNewGroup}
              icon={<AddIcon />}
            />
            <IconBtn
              title="Notifications"
              onClick={openNotification}
              icon={<NotificationsIcon />}
              value={notificationCount}
              badgeColor={notificationCount > 0 ? "error" : "info"}
            />
            <IconBtn
              title="Manage Groups"
              active={pathname === "/groups"}
              onClick={() => router.push("/groups")}
              icon={<GroupIcon />}
            />
            <IconBtn
              title="My Board"
              active={pathname === "/board"}
              onClick={() => router.push("/board")}
              icon={<ForumIcon />}
            />
            <IconBtn
              title="Logout"
              onClick={logoutHandler}
              icon={<LogoutIcon />}
            />
          </Box>

          <Box sx={{ display: { xs: "block", lg: "none" } }}>
            <IconBtn
              title="Profile"
              onClick={openProfile}
              icon={<AccountCircleIcon />}
            />
          </Box>
        </Toolbar>
      </AppBar>

      {isSearch && (
        <Suspense fallback={<Backdrop open={true} />}>
          <SearchDialog />
        </Suspense>
      )}

      {isNewGroup && (
        <Suspense fallback={<Backdrop open={true} />}>
          <NewGroupDialog />
        </Suspense>
      )}

      {isNotification && (
        <Suspense fallback={<Backdrop open={true} />}>
          <NotificationsDialog />
        </Suspense>
      )}
    </>
  );
}

const IconBtn = ({ title, onClick, icon, value, showZero = false, badgeColor = "error", active = false }) => {
  const shouldShowBadge = showZero || Boolean(value);

  return (
    <Tooltip title={title} arrow>
      <IconButton
        aria-label={title}
        aria-current={active ? "page" : undefined}
        color="inherit"
        onClick={onClick}
        size="large"
        sx={{
          width: { xs: 32, sm: 42 },
          height: { xs: 40, sm: 42 },
          borderRadius: "12px",
          color: active ? "#4361d8" : "#66738a",
          bgcolor: active ? "#edf1ff" : "transparent",
          transition: "transform 0.2s, background-color 0.3s",
          "&:hover": {
            transform: "translateY(-2px)",
            backgroundColor: "#edf1ff",
          },
        }}
      >
        {shouldShowBadge ? (
          <Badge color={badgeColor} badgeContent={value} showZero={showZero}>
            {icon}
          </Badge>
        ) : (
          icon
        )}
      </IconButton>
    </Tooltip>
  );
};
