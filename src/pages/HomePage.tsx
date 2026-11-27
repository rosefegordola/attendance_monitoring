import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import Icon from "../components/Icon";
import { isOfficialSorsuEmail } from "../firebase/teacherAccess";

export default function HomePage() {
  const { user, profile, emailVerified } = useAuth();
  const teacherAccess = Boolean(
    profile?.role === "teacher" &&
    profile.status === "active" &&
    emailVerified &&
    isOfficialSorsuEmail(user?.email),
  );
  const teacherPortal = user
    ? profile?.role === "student" ? "/teacher/register" : teacherAccess ? "/teacher" : "/teacher/verify-email"
    : "/teacher/login";
  const studentPortal = user ? "/dashboard" : "/login";
  const homeDestination = user && profile?.role !== "student"
    ? teacherAccess ? "/teacher" : "/teacher/verify-email"
    : "/dashboard";
  return (
    <main>
      <section className="hero">
        <div className="container hero-grid">
          <div className="hero-copy">
            <span className="eyebrow">SORSOGON STATE UNIVERSITY · BULAN CAMPUS</span>
            <h1>Every class.<br /><span>Every student.</span><br />Accounted for.</h1>
            <p>A simple, dependable way for Bulan Campus teachers to manage attendance and for students to stay informed.</p>
            <div className="button-row">
              <Link className={`button ${user ? "button-gold" : "button-light-outline"}`} to={user ? homeDestination : "/teacher/register"}>{user ? teacherAccess || profile?.role === "student" ? "Go to dashboard" : "Verify email" : "Teacher registration"}</Link>
              {!user && <Link className="button button-light-outline" to="/register">Student registration</Link>}
            </div>
            <div className="hero-note"><span className="hero-dot" /> Built for the SorsU Bulan community</div>
          </div>
          <div className="hero-visual" aria-label="Attendance workspace overview">
            <div className="visual-top">
              <span className="visual-emblem">S</span>
              <span className="visual-brand"><strong>SorsU Bulan</strong><small>Campus attendance portal</small></span>
              <span className="visual-secure"><span /> SECURE ACCESS</span>
            </div>
            <div className="visual-content">
              <p className="visual-date">YOUR CAMPUS WORKSPACE</p>
              <h2>{profile ? `Welcome, ${profile.fullName.split(" ")[0]}.` : "Choose your portal"}</h2>
              <p className="muted">Sign in to access the tools for your role.</p>
              <div className="visual-stats">
                <Link className="portal-card" to={!user ? "/teacher/login" : teacherPortal}>
                  <span className="portal-icon portal-icon-teacher"><Icon name="attendance" /></span>
                  <span className="portal-copy"><strong>Teacher portal</strong><span>{teacherAccess ? "Attendance, roster, and reports" : user ? profile?.role === "student" ? "Sign in with a teacher account" : "Verify university email to activate" : "Sign in to manage attendance"}</span></span>
                  <Icon name="arrowRight" className="portal-arrow" />
                </Link>
                <Link className="portal-card" to={!user ? "/login" : studentPortal}>
                  <span className="portal-icon portal-icon-student"><Icon name="students" /></span>
                  <span className="portal-copy"><strong>Student portal</strong><span>{user ? "Personal attendance record" : "Sign in to view your records"}</span></span>
                  <Icon name="arrowRight" className="portal-arrow" />
                </Link>
              </div>
              <div className="portal-foot"><Icon name="building" /><span>For Sorsogon State University — Bulan Campus</span></div>
            </div>
          </div>
        </div>
      </section>

      <section className="section container" aria-labelledby="features-title">
        <div className="section-heading">
          <span className="eyebrow eyebrow-blue">MADE FOR CAMPUS LIFE</span>
          <h2 id="features-title">Attendance, without the hassle.</h2>
          <p>Spend less time on paperwork and more time helping students succeed.</p>
        </div>
        <div className="feature-grid">
          <article className="feature-card"><span className="feature-icon"><Icon name="clock" /></span><h3>Real-time overview</h3><p>See today’s attendance and trends as records are updated.</p></article>
          <article className="feature-card"><span className="feature-icon gold"><Icon name="check" /></span><h3>Quick class check-in</h3><p>Mark a whole class present, absent, late, or excused in moments.</p></article>
          <article className="feature-card"><span className="feature-icon pale"><Icon name="reports" /></span><h3>Clear reports</h3><p>Filter attendance by class, date, and status when you need it.</p></article>
        </div>
      </section>

      <section className="how-section">
        <div className="container how-grid">
          <div><span className="eyebrow">HOW IT WORKS</span><h2>Three steps.<br />A clearer picture.</h2><p>Keep attendance consistent across your classes, with the right information available to the right people.</p></div>
          <ol className="steps">
            <li><span>01</span><div><h3>Set up your classes</h3><p>Add students and class details once; keep them up to date as the term moves along.</p></div></li>
            <li><span>02</span><div><h3>Take attendance</h3><p>Choose your class and date, then record each student’s status.</p></div></li>
            <li><span>03</span><div><h3>Review the trends</h3><p>Use your dashboard and reports to see attendance over time.</p></div></li>
          </ol>
        </div>
      </section>

      <section className="stats-strip container">
        <div><strong>One</strong><span>connected campus view</span></div>
        <div><strong>4</strong><span>attendance statuses</span></div>
        <div><strong>Anytime</strong><span>access to your reports</span></div>
        <div><strong>{user ? "Welcome" : "SorsU"}</strong><span>{user ? " " + profile?.role + " account" : "Bulan Campus"}</span></div>
      </section>
    </main>
  );
}
