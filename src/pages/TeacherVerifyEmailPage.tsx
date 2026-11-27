import { useCallback, useEffect, useRef, useState } from "react";
import { sendEmailVerification } from "firebase/auth";
import { Link, Navigate } from "react-router-dom";
import Icon from "../components/Icon";
import LoadingSpinner from "../components/LoadingSpinner";
import { useAuth } from "../context/AuthContext";
import { auth } from "../firebase/firebase";
import { isOfficialSorsuEmail } from "../firebase/teacherAccess";

export default function TeacherVerifyEmailPage() {
  const { user, profile, emailVerified, loading, error, refreshEmailVerification } = useAuth();
  const [checking, setChecking] = useState(false);
  const [resending, setResending] = useState(false);
  const [notice, setNotice] = useState("");
  const [verificationError, setVerificationError] = useState("");
  const checkingRef = useRef(false);

  const checkVerification = useCallback(async (showFeedback = false) => {
    if (checkingRef.current || !auth.currentUser) return;
    checkingRef.current = true;
    setChecking(true);
    if (showFeedback) setVerificationError("");
    try {
      const verified = await refreshEmailVerification();
      if (verified) setNotice("Email verified. Activating your teacher account…");
      else if (showFeedback) setVerificationError("Your email is not verified yet. Open the link we sent, then try again.");
    } catch (reason) {
      setVerificationError(reason instanceof Error ? reason.message : "Unable to check email verification.");
    } finally {
      checkingRef.current = false;
      setChecking(false);
    }
  }, [refreshEmailVerification]);

  useEffect(() => {
    if (!user || emailVerified) return;
    const check = () => { void checkVerification(); };
    check();
    const interval = window.setInterval(check, 10_000);
    window.addEventListener("focus", check);
    return () => {
      window.clearInterval(interval);
      window.removeEventListener("focus", check);
    };
  }, [checkVerification, emailVerified, user]);

  if (loading) return <main className="container page-content"><LoadingSpinner label="Checking your account" /></main>;
  if (!user) return <Navigate to="/teacher/login" replace />;
  if (profile?.role === "student") return <Navigate to="/dashboard" replace />;
  if (!isOfficialSorsuEmail(user.email)) {
    return <main className="container page-content"><p className="alert alert-error" role="alert">Teacher access requires an @sorsu.edu.ph email address.</p></main>;
  }
  if (error || !profile) {
    return <main className="container page-content"><p className="alert alert-error" role="alert">{error || "Your teacher profile is unavailable."}</p></main>;
  }
  if (profile.role === "teacher" && profile.status === "active" && emailVerified) {
    return <Navigate to="/teacher" replace />;
  }
  if (profile.role !== "teacher" && profile.role !== "pendingTeacher") {
    return <main className="container page-content"><p className="alert alert-error" role="alert">This account is not registered for teacher access.</p></main>;
  }

  const verificationEmail = user.email;

  async function resendVerification() {
    if (!auth.currentUser || emailVerified) return;
    setResending(true);
    setVerificationError("");
    setNotice("");
    try {
      await sendEmailVerification(auth.currentUser);
      setNotice(`A verification link was sent to ${verificationEmail}.`);
    } catch (reason) {
      setVerificationError(reason instanceof Error ? reason.message : "Unable to send a verification email.");
    } finally {
      setResending(false);
    }
  }

  return (
    <main className="container page-content">
      <section className="panel teacher-verification-card">
        <span className="teacher-verification-icon"><Icon name={emailVerified ? "check" : "clock"} /></span>
        <span className="eyebrow eyebrow-blue">TEACHER ACCOUNT ACTIVATION</span>
        <h1>{emailVerified ? "Activating your account" : "Verify your university email"}</h1>
        <p className="muted">
          {emailVerified
            ? "Your email is verified. Teacher access is being enabled automatically."
            : <>We sent a verification link to <strong>{user.email}</strong>. Verify your @sorsu.edu.ph address to activate your teacher account.</>}
        </p>
        {profile.fullName && <div className="teacher-verification-details"><span>Account name</span><strong>{profile.fullName}</strong><span>Teacher ID</span><strong>{profile.teacherId || "Not provided"}</strong><span>University email</span><strong>{profile.email}</strong></div>}
        {notice && <p className="alert alert-success" role="status">{notice}</p>}
        {verificationError && <p className="alert alert-error" role="alert">{verificationError}</p>}
        <div className="button-row teacher-verification-actions">
          {!emailVerified && <button className="button button-outline" type="button" onClick={resendVerification} disabled={resending}>{resending ? "Sending…" : "Resend verification email"}</button>}
          <button className="button button-primary" type="button" onClick={() => checkVerification(true)} disabled={checking}>{checking ? "Checking…" : "I’ve verified my email"}</button>
        </div>
        <p className="teacher-verification-note">This page checks automatically after you verify. <Link to="/teacher/login">Sign in</Link> if you have already verified on another device.</p>
      </section>
    </main>
  );
}
