"use client";

import { Avatar, Stack, Typography } from "@mui/material";
import { useMemo } from "react";
import AdminAsyncContent from "../../../components/layout/AdminAsyncContent";
import AvatarCard from "../../../components/shared/AvatarCard";
import Table from "../../../components/shared/Table";
import { useErrors } from "../../../hooks/useHooks";
import { transformImageUrl } from "../../../lib/features";
import { useGetChatsDashboardStatsQuery } from "../../../redux/api/api";

const columns = [
  {
    field: "id",
    headerName: "ID",
    headerClassName: "table-header",
    width: 100,
  },
  {
    field: "name",
    headerName: "Name",
    headerClassName: "table-header",
    width: 100,
  },

  {
    field: "totalMembers",
    headerName: "Total Members",
    headerClassName: "table-header",
    width: 100,
  },
  {
    field: "members",
    headerName: "Members",
    headerClassName: "table-header",
    width: 300,
    renderCell: (params) => (
      <AvatarCard max={100} avatar={params.row.members} />
    ),
  },
  {
    field: "totalMessages",
    headerName: "Total Messages",
    headerClassName: "table-header",
    width: 100,
  },
  {
    field: "groupChat",
    headerName: "Group Chat",
    headerClassName: "table-header",
    width: 100,
  },
  {
    field: "creator",
    headerName: "Created By",
    headerClassName: "table-header",
    width: 200,
    renderCell: (params) => (
      <Stack direction={"row"} alignItems={"center"} spacing={"1rem"}>
        <Avatar alt={params.row.creator.name} src={params.row.creator.avatar} />
        <Typography>{params.row.creator.name}</Typography>
      </Stack>
    ),
  },
];

export default function Chats() {
  const {
    data: chatDashboardData,
    isLoading: loadingChatDashboardData,
    isError: errorChatDashboardData,
    error: errorChatDashboardDataMessage,
    refetch,
  } = useGetChatsDashboardStatsQuery();

  useErrors([
    {
      isError: errorChatDashboardData,
      error: errorChatDashboardDataMessage,
    },
  ]);

  const rows = useMemo(
    () =>
      (chatDashboardData?.chats || []).map((chat) => ({
        ...chat,
        id: chat._id,
        avatar: chat.avatar.map((member) => transformImageUrl(member, 50)),
        members: chat.members.map((member) =>
          transformImageUrl(member.avatar, 50),
        ),
        creator: {
          ...chat.creator,
          avatar: transformImageUrl(chat.creator.avatar, 50),
        },
      })),
    [chatDashboardData],
  );

  return (
    <AdminAsyncContent
      isLoading={loadingChatDashboardData}
      error={errorChatDashboardData ? errorChatDashboardDataMessage : null}
      loadingLabel="Loading chats…"
      onRetry={refetch}
    >
      <Table headings="All Chats" columns={columns} rows={rows} />
    </AdminAsyncContent>
  );
}
