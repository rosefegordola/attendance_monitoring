import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { useAuth } from "./context/AuthContext";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import ProtectedRoute from "./components/ProtectedRoute";
import HomePage from "./pages/HomePage";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import TeacherRegisterPage from "./pages/TeacherRegisterPage";
import TeacherVerifyEmailPage from "./pages/TeacherVerifyEmailPage";
import DashboardPage from "./pages/DashboardPage";
import StudentsPage from "./pages/StudentsPage";
import ClassesPage from "./pages/ClassesPage";
import AttendancePage from "./pages/AttendancePage";
import ReportsPage from "./pages/ReportsPage";
import TeacherDashboardPage from "./pages/TeacherDashboardPage";
import TeacherRosterPage from "./pages/TeacherRosterPage";
import TeacherAttendancePage from "./pages/TeacherAttendancePage";
import TeacherReportsPage from "./pages/TeacherReportsPage";

function DashboardRoute() {
  const { profile } = useAuth();
  if (profile?.role === "teacher") return <Navigate to="/teacher" replace />;
  return <DashboardPage />;
}

function NotFoundPage() {
  return <main className="container page-content"><section className="panel empty-state"><span className="eyebrow eyebrow-blue">404 · PAGE NOT FOUND</span><h1>That page isn’t here.</h1><p className="muted">The link may be incorrect or the page may have moved.</p><a className="button button-primary" href="/">Back to home</a></section></main>;
}

export default function App() {
  return (
    <BrowserRouter>
      <div className="app-shell">
        <Navbar />
        <div className="app-content">
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/teacher/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/teacher/register" element={<TeacherRegisterPage />} />
            <Route path="/teacher/verify-email" element={<TeacherVerifyEmailPage />} />
            <Route path="/teacher/pending" element={<Navigate to="/teacher/verify-email" replace />} />
            <Route element={<ProtectedRoute />}>
              <Route path="/dashboard" element={<DashboardRoute />} />
              <Route path="/reports" element={<ReportsPage />} />
            </Route>
            <Route element={<ProtectedRoute roles={["teacher"]} />}>
              <Route path="/teacher" element={<TeacherDashboardPage />} />
              <Route path="/teacher/roster" element={<TeacherRosterPage />} />
              <Route path="/teacher/attendance" element={<TeacherAttendancePage />} />
              <Route path="/teacher/reports" element={<TeacherReportsPage />} />
              <Route path="/students" element={<StudentsPage />} />
              <Route path="/classes" element={<ClassesPage />} />
              <Route path="/attendance" element={<AttendancePage />} />
            </Route>
            <Route path="/not-found" element={<NotFoundPage />} />
            <Route path="*" element={<Navigate to="/not-found" replace />} />
          </Routes>
        </div>
        <Footer />
      </div>
    </BrowserRouter>
  );
}
