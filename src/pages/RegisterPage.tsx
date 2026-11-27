import { useState, type FormEvent } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { auth, db, isFirebaseConfigured } from "../firebase/firebase";
import { useAuth } from "../context/AuthContext";

export default function RegisterPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [fullName, setFullName] = useState("");
  const [studentId, setStudentId] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  if (user) return <Navigate to="/dashboard" replace />;

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    if (!isFirebaseConfigured) {
      setError("Firebase is not configured. Add your project values to the .env file.");
      return;
    }
    setBusy(true);
    try {
      if (!/^[A-Za-z0-9._-]+$/.test(studentId.trim())) throw new Error("Use letters, numbers, periods, underscores, or hyphens in your student ID.");
      const normalizedEmail = email.trim().toLowerCase();
      const credential = await createUserWithEmailAndPassword(auth, normalizedEmail, password);
      try {
        await setDoc(doc(db, "users", credential.user.uid), {
          uid: credential.user.uid,
          fullName: fullName.trim(),
          email: normalizedEmail,
          role: "student",
          studentId: studentId.trim(),
          createdAt: serverTimestamp(),
        });
      } catch (profileError) {
        try {
          await credential.user.delete();
        } catch {
          throw new Error("Your account was created, but its student profile could not be saved. Contact a campus administrator before trying again.");
        }
        if (
          typeof profileError === "object" &&
          profileError !== null &&
          "code" in profileError &&
          profileError.code === "permission-denied"
        ) {
          throw new Error("Your student ID and email must match a student record added by your teacher.");
        }
        throw profileError;
      }
      navigate("/dashboard");
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Unable to register. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="auth-page">
      <section className="auth-card">
        <span className="eyebrow eyebrow-blue">STUDENT ACCESS</span>
        <h1>Create your account</h1>
        <p className="muted">Use the student ID already registered by your teacher.</p>
        <form className="stack-form" onSubmit={submit}>
          <div className="field"><label htmlFor="register-name">Full name</label><input id="register-name" autoComplete="name" required value={fullName} onChange={(event) => setFullName(event.target.value)} /></div>
          <div className="field"><label htmlFor="register-student-id">Student ID</label><input id="register-student-id" required value={studentId} onChange={(event) => setStudentId(event.target.value)} /></div>
          <div className="field"><label htmlFor="register-email">Email address</label><input id="register-email" type="email" autoComplete="email" required value={email} onChange={(event) => setEmail(event.target.value)} /></div>
          <div className="field"><label htmlFor="register-password">Password <span className="muted">(at least 6 characters)</span></label><input id="register-password" type="password" autoComplete="new-password" minLength={6} required value={password} onChange={(event) => setPassword(event.target.value)} /></div>
          {error && <p className="alert alert-error" role="alert">{error}</p>}
          <button className="button button-primary button-wide" type="submit" disabled={busy}>{busy ? "Creating account…" : "Create account"}</button>
        </form>
        <p className="auth-switch">Already registered? <Link to="/login">Sign in</Link></p>
      </section>
      <aside className="auth-aside"><span className="aside-emblem">S</span><h2>Your progress,<br />all in one place.</h2><p>Stay connected to your campus attendance record.</p></aside>
    </main>
  );
}
