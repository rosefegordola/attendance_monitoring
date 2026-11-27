import { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { signOut } from "firebase/auth";
import { auth } from "../firebase/firebase";
import { isOfficialSorsuEmail } from "../firebase/teacherAccess";
import { useAuth } from "../context/AuthContext";
import Icon, { type IconName } from "./Icon";

const navigationIcons: Record<string, IconName> = {
  Home: "home",
  "Student sign in": "login",
  "Teacher sign in": "login",
  "Teacher registration": "register",
  "Student registration": "register",
  "Verify email": "clock",
  Dashboard: "dashboard",
  Students: "students",
  Classes: "classes",
  Attendance: "attendance",
  Reports: "reports",
  Roster: "students",
};

export default function Navbar() {
  const { user, profile, emailVerified } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const hasTeacherAccess = Boolean(
    user &&
    profile?.role === "teacher" &&
    profile.status === "active" &&
    emailVerified &&
    isOfficialSorsuEmail(user.email),
  );

  async function logout() {
    await signOut(auth);
    setMenuOpen(false);
    navigate("/");
  }

  const links = !user
    ? [
        { to: "/", label: "Home" },
        { to: "/login", label: "Student sign in" },
        { to: "/teacher/login", label: "Teacher sign in" },
        { to: "/teacher/register", label: "Teacher registration" },
        { to: "/register", label: "Student registration" },
      ]
    : hasTeacherAccess
    ? [
        { to: "/teacher", label: "Dashboard" },
        { to: "/teacher/roster", label: "Roster" },
        { to: "/classes", label: "Classes" },
        { to: "/teacher/attendance", label: "Attendance" },
        { to: "/teacher/reports", label: "Reports" },
      ]
    : profile?.role === "student"
    ? [
        { to: "/dashboard", label: "Dashboard" },
        { to: "/reports", label: "Reports" },
      ]
    : [{ to: "/teacher/verify-email", label: "Verify email" }];

  return (
    <header className="site-header">
      <nav className="navbar container" aria-label="Main navigation">
        <NavLink className="brand" to="/" onClick={() => setMenuOpen(false)}>
          <span className="brand-mark" aria-hidden="true">S</span>
          <span><strong>SorsU Bulan</strong><small>Attendance monitoring</small></span>
        </NavLink>
        <button
          className="menu-toggle"
          type="button"
          aria-label={menuOpen ? "Close navigation menu" : "Open navigation menu"}
          aria-expanded={menuOpen}
          aria-controls="primary-navigation"
          onClick={() => setMenuOpen(!menuOpen)}
        >
          <span /><span /><span />
        </button>
        <div id="primary-navigation" className={`nav-links${menuOpen ? " open" : ""}`}>
          {links.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.to === "/"}
              className={({ isActive }) => isActive ? "active" : ""}
              onClick={() => setMenuOpen(false)}
            >
              <Icon name={navigationIcons[link.label]} className="nav-icon" />
              <span>{link.label}</span>
            </NavLink>
          ))}
          {user && (
            <button type="button" className="button button-outline nav-logout" onClick={logout}>
              <Icon name="logout" className="nav-icon" />
              <span>Log out</span>
            </button>
          )}
        </div>
      </nav>
    </header>
  );
}
