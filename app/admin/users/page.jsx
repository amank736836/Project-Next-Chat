"use client";

import { Avatar } from "@mui/material";
import { useMemo } from "react";
import AdminAsyncContent from "../../../components/layout/AdminAsyncContent";
import Table from "../../../components/shared/Table";
import { useErrors } from "../../../hooks/useHooks";
import { transformImageUrl } from "../../../lib/features";
import { useGetUsersDashboardStatsQuery } from "../../../redux/api/api";

const UserColumns = [
  {
    field: "id",
    headerName: "ID",
    headerClassName: "table-header",
    width: 75,
  },
  {
    field: "avatar",
    headerName: "Avatar",
    headerClassName: "table-header",
    width: 75,
    renderCell: (params) => (
      <Avatar alt={params.row.name} src={params.row.avatar} />
    ),
  },
  {
    field: "name",
    headerName: "Name",
    headerClassName: "table-header",
    width: 150,
  },
  {
    field: "username",
    headerName: "Username",
    headerClassName: "table-header",
    width: 150,
  },
  {
    field: "email",
    headerName: "Email",
    headerClassName: "table-header",
    width: 200,
  },
  {
    field: "friends",
    headerName: "Friends",
    headerClassName: "table-header",
    width: 100,
  },
  {
    field: "groups",
    headerName: "Groups",
    headerClassName: "table-header",
    width: 90,
  },
  {
    field: "createdAt",
    headerName: "Created At",
    headerClassName: "table-header",
    width: 175,
  },
];

export default function Users() {
  const {
    data: userDashboardData,
    isLoading: loadingUserDashboardData,
    isError: errorUserDashboardData,
    error: errorUserDashboardDataMessage,
    refetch,
  } = useGetUsersDashboardStatsQuery();

  useErrors([
    {
      isError: errorUserDashboardData,
      error: errorUserDashboardDataMessage,
    },
  ]);

  const rows = useMemo(
    () =>
      (userDashboardData?.users || []).map((user) => ({
        ...user,
        id: user._id,
        avatar: transformImageUrl(user.avatar, 50),
      })),
    [userDashboardData],
  );

  return (
    <AdminAsyncContent
      isLoading={loadingUserDashboardData}
      error={errorUserDashboardData ? errorUserDashboardDataMessage : null}
      loadingLabel="Loading users…"
      onRetry={refetch}
    >
      <Table headings="All Users" columns={UserColumns} rows={rows} />
    </AdminAsyncContent>
  );
}
