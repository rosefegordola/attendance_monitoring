import { useState, type FormEvent } from "react";
import { createUserWithEmailAndPassword, sendEmailVerification } from "firebase/auth";
import { doc, serverTimestamp, setDoc } from "firebase/firestore";
import { Link, Navigate, useNavigate } from "react-router-dom";
import LoadingSpinner from "../components/LoadingSpinner";
import { useAuth } from "../context/AuthContext";
import { auth, db, isFirebaseConfigured } from "../firebase/firebase";
import { isOfficialSorsuEmail } from "../firebase/teacherAccess";

export default function TeacherRegisterPage() {
  const { user, profile, loading, emailVerified } = useAuth();
  const navigate = useNavigate();
  const [fullName, setFullName] = useState("");
  const [teacherId, setTeacherId] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  if (user && loading) return <main className="container page-content"><LoadingSpinner label="Checking your account" /></main>;
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

    setBusy(true);
    try {
      if (!teacherId.trim()) throw new Error("Teacher ID is required.");
      const normalizedEmail = email.trim().toLowerCase();
      if (!isOfficialSorsuEmail(normalizedEmail)) {
        throw new Error("Teacher registration requires an @sorsu.edu.ph email address.");
      }
      const credential = await createUserWithEmailAndPassword(auth, normalizedEmail, password);
      try {
        await sendEmailVerification(credential.user);
        await setDoc(doc(db, "users", credential.user.uid), {
          uid: credential.user.uid,
          fullName: fullName.trim(),
          teacherId: teacherId.trim(),
          email: normalizedEmail,
          role: "teacher",
          status: "pendingEmailVerification",
          createdAt: serverTimestamp(),
        });
      } catch (profileError) {
        try {
          await credential.user.delete();
        } catch {
          throw new Error("Your account was created, but verification could not be set up. Sign in again or contact support.");
        }
        if (
          typeof profileError === "object" &&
          profileError !== null &&
          "code" in profileError &&
          profileError.code === "permission-denied"
        ) {
          throw new Error("Teacher registration is not enabled. Deploy the updated Firestore rules and try again.");
        }
        throw profileError;
      }
      navigate("/teacher/verify-email");
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Unable to submit teacher registration.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="auth-page">
      <section className="auth-card">
        <span className="eyebrow eyebrow-blue">TEACHER ACCESS</span>
        <h1>Teacher registration</h1>
        <p className="muted">Use your university email. We’ll activate teacher access automatically after you verify it.</p>
        <form className="stack-form" onSubmit={submit}>
          <div className="field"><label htmlFor="teacher-register-name">Full name</label><input id="teacher-register-name" autoComplete="name" required value={fullName} onChange={(event) => setFullName(event.target.value)} /></div>
          <div className="field"><label htmlFor="teacher-register-id">Teacher ID</label><input id="teacher-register-id" required value={teacherId} onChange={(event) => setTeacherId(event.target.value)} /></div>
          <div className="field"><label htmlFor="teacher-register-email">University email address</label><input id="teacher-register-email" type="email" autoComplete="email" required value={email} onChange={(event) => setEmail(event.target.value)} /></div>
          <div className="field"><label htmlFor="teacher-register-password">Password <span className="muted">(at least 6 characters)</span></label><input id="teacher-register-password" type="password" autoComplete="new-password" minLength={6} required value={password} onChange={(event) => setPassword(event.target.value)} /></div>
          {error && <p className="alert alert-error" role="alert">{error}</p>}
          <button className="button button-primary button-wide" type="submit" disabled={busy}>{busy ? "Creating account…" : "Create account"}</button>
        </form>
        <p className="auth-switch">Already registered? <Link to="/teacher/login">Teacher sign in</Link></p>
      </section>
      <aside className="auth-aside"><span className="aside-emblem">S</span><h2>Join the<br />SorsU Bulan team.</h2><p>Verify your university email to activate your teacher account and access campus tools.</p></aside>
    </main>
  );
}
