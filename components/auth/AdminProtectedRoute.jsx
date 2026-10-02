"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useDispatch, useSelector } from "react-redux";
import { getAdmin } from "../../redux/thunks/admin.thunk.js";
import AdminAsyncContent from "../layout/AdminAsyncContent";

export default function AdminProtectedRoute({ children }) {
  const { isAdmin } = useSelector((state) => state.auth);
  const [isCheckingSession, setIsCheckingSession] = useState(true);
  const dispatch = useDispatch();
  const router = useRouter();

  // A hard refresh has no Redux session yet, even when the admin cookie is valid.
  useEffect(() => {
    let mounted = true;
    dispatch(getAdmin()).finally(() => {
      if (mounted) setIsCheckingSession(false);
    });
    return () => {
      mounted = false;
    };
  }, [dispatch]);

  useEffect(() => {
    if (!isCheckingSession && !isAdmin) router.replace("/admin/login");
  }, [isAdmin, isCheckingSession, router]);

  if (isCheckingSession || !isAdmin) {
    return (
      <div className="admin-motion-root">
        <AdminAsyncContent isLoading loadingLabel="Checking admin session…" />
      </div>
    );
  }

  return children;
}
