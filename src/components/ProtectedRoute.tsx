import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import LoadingSpinner from "./LoadingSpinner";
import type { UserRole } from "../types";
import { isOfficialSorsuEmail } from "../firebase/teacherAccess";

export default function ProtectedRoute({ roles }: { roles?: UserRole[] }) {
  const { user, profile, emailVerified, loading, error } = useAuth();
  if (loading) return <LoadingSpinner label="Checking your account" />;
  if (!user) return <Navigate to="/login" replace />;
  if (error || !profile) return <div className="container"><p className="alert alert-error">{error || "Account profile unavailable."}</p></div>;
  if (
    profile.role !== "student" &&
    (
      profile.role !== "teacher" ||
      profile.status !== "active" ||
      !emailVerified ||
      !isOfficialSorsuEmail(user.email)
    )
  ) return <Navigate to="/teacher/verify-email" replace />;
  if (roles && !roles.includes(profile.role)) return <Navigate to="/dashboard" replace />;
  return <Outlet />;
}
