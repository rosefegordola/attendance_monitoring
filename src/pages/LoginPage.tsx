import { useState, type FormEvent } from "react";
import { Link, Navigate, useLocation } from "react-router-dom";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth, isFirebaseConfigured } from "../firebase/firebase";
import { useAuth } from "../context/AuthContext";
import LoadingSpinner from "../components/LoadingSpinner";
import { isOfficialSorsuEmail } from "../firebase/teacherAccess";

export default function LoginPage() {
  const { user, profile, emailVerified, loading } = useAuth();
  const isTeacherLogin = useLocation().pathname === "/teacher/login";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  if (user && loading) return <main className="container page-content"><LoadingSpinner label="Loading your account" /></main>;
  if (user) {
    const destination = profile?.role === "student"
      ? "/dashboard"
      : profile?.role === "teacher" && profile.status === "active" && emailVerified
      ? "/teacher"
      : "/teacher/verify-email";
    return <Navigate to={destination} replace />;
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    if (!isFirebaseConfigured) {
      setError("Firebase is not configured. Add your project values to the .env file.");
      return;
    }
    if (isTeacherLogin && !isOfficialSorsuEmail(email)) {
      setError("Teacher sign in requires an @sorsu.edu.ph email address.");
      return;
    }
    setBusy(true);
    try {
      await signInWithEmailAndPassword(auth, email.trim(), password);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Unable to sign in. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="auth-page">
      <section className="auth-card">
        <span className="eyebrow eyebrow-blue">{isTeacherLogin ? "TEACHER ACCESS" : "WELCOME BACK"}</span>
        <h1>{isTeacherLogin ? "Teacher sign in" : "Sign in to your account"}</h1>
        <p className="muted">{isTeacherLogin ? "Sign in with a teacher account to monitor attendance and manage your classes." : "Use your SorsU Bulan account to continue."}</p>
        <form className="stack-form" onSubmit={submit}>
          <div className="field"><label htmlFor="login-email">Email address</label><input id="login-email" type="email" autoComplete="email" required value={email} onChange={(event) => setEmail(event.target.value)} /></div>
          <div className="field"><label htmlFor="login-password">Password</label><input id="login-password" type="password" autoComplete="current-password" required value={password} onChange={(event) => setPassword(event.target.value)} /></div>
          {error && <p className="alert alert-error" role="alert">{error}</p>}
          <button className="button button-primary button-wide" type="submit" disabled={busy}>{busy ? "Signing in…" : "Sign in"}</button>
        </form>
        <p className="auth-switch">{isTeacherLogin ? <>Need a teacher account? <Link to="/teacher/register">Apply for registration</Link></> : <>New student? <Link to="/register">Create an account</Link></>}</p>
      </section>
      <aside className="auth-aside"><span className="aside-emblem">S</span><h2>Learning today.<br />Leading tomorrow.</h2><p>Sorsogon State University — Bulan Campus</p></aside>
    </main>
  );
}
