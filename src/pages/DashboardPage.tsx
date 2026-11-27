import { useEffect, useMemo, useState } from "react";
import { collection, onSnapshot, query, where } from "firebase/firestore";
import { db } from "../firebase/firebase";
import { useAuth } from "../context/AuthContext";
import type { AttendanceRecord, Student } from "../types";
import LoadingSpinner from "../components/LoadingSpinner";
import Icon from "../components/Icon";

function localDate(date: Date) {
  const offset = date.getTimezoneOffset();
  return new Date(date.getTime() - offset * 60_000).toISOString().slice(0, 10);
}

export default function DashboardPage() {
  const { profile } = useAuth();
  const [students, setStudents] = useState<Student[]>([]);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let studentsReady = profile?.role !== "teacher";
    let attendanceReady = false;
    const finishLoading = () => setLoading(!(studentsReady && attendanceReady));
    const stopStudents = profile?.role === "teacher"
      ? onSnapshot(collection(db, "students"), (snapshot) => {
          setStudents(snapshot.docs.map((item) => ({ ...item.data(), id: item.id } as Student)));
          studentsReady = true;
          finishLoading();
        }, (reason) => { setError(reason.message); studentsReady = true; finishLoading(); })
      : () => undefined;
    const attendanceQuery = profile?.role === "student"
      ? query(collection(db, "attendance"), where("studentId", "==", profile.studentId || ""))
      : collection(db, "attendance");
    const stopAttendance = onSnapshot(attendanceQuery, (snapshot) => {
      const all = snapshot.docs.map((item) => ({ ...item.data(), id: item.id } as AttendanceRecord));
      setAttendance(all);
      attendanceReady = true;
      finishLoading();
    }, (reason) => { setError(reason.message); attendanceReady = true; finishLoading(); });
    return () => { stopStudents(); stopAttendance(); };
  }, [profile]);

  const today = localDate(new Date());
  const todays = useMemo(() => attendance.filter((record) => record.date === today), [attendance, today]);
  const present = todays.filter((record) => record.status === "Present").length;
  const late = todays.filter((record) => record.status === "Late").length;
  const absent = todays.filter((record) => record.status === "Absent").length;
  const total = profile?.role === "teacher" ? students.length : (profile?.studentId ? 1 : 0);
  const week = Array.from({ length: 7 }, (_, index) => {
    const date = new Date();
    date.setDate(date.getDate() - (6 - index));
    const key = localDate(date);
    const records = attendance.filter((record) => record.date === key);
    const rate = records.length ? Math.round((records.filter((record) => record.status === "Present" || record.status === "Late").length / records.length) * 100) : 0;
    return { label: date.toLocaleDateString(undefined, { weekday: "short" }), rate };
  });

  if (loading) return <main className="container page-content"><LoadingSpinner label="Loading your dashboard" /></main>;
  return (
    <main className="container page-content">
      <div className="page-heading">
        <div><span className="eyebrow eyebrow-blue">CAMPUS OVERVIEW</span><h1>Good day, {profile?.fullName.split(" ")[0] || "there"}.</h1><p className="muted">Here’s your attendance snapshot for {new Date().toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" })}.</p></div>
        <span className="role-pill">{profile?.role === "teacher" ? "Teacher workspace" : "Student view"}</span>
      </div>
      {error && <p className="alert alert-error" role="alert">{error}</p>}
      <section className="metric-grid" aria-label="Attendance metrics">
        <article className="metric-card"><span className="metric-label">{profile?.role === "teacher" ? "Total students" : "My student record"}</span><strong>{total}</strong><span className="metric-foot">Registered on campus</span><span className="metric-icon blue-icon"><Icon name="students" /></span></article>
        <article className="metric-card"><span className="metric-label">Present today</span><strong>{present}</strong><span className="metric-foot">Marked present</span><span className="metric-icon green-icon"><Icon name="check" /></span></article>
        <article className="metric-card"><span className="metric-label">Absent today</span><strong>{absent}</strong><span className="metric-foot">Marked absent</span><span className="metric-icon red-icon"><Icon name="close" /></span></article>
        <article className="metric-card"><span className="metric-label">Late today</span><strong>{late}</strong><span className="metric-foot">Arrived late</span><span className="metric-icon gold-icon"><Icon name="clock" /></span></article>
      </section>
      <section className="dashboard-grid">
        <article className="panel chart-panel">
          <div className="panel-heading"><div><h2>Attendance rate</h2><p className="muted">Present and late records over the last 7 days</p></div><span className="chart-period">LAST 7 DAYS</span></div>
          <div className="bar-chart" role="img" aria-label={`Attendance rates over the last seven days: ${week.map((day) => `${day.label} ${day.rate}%`).join(", ")}`}>
            {week.map(({ label, rate }) => <div className="bar-column" key={label}><span className="bar-value">{rate}%</span><div className="bar-track"><span className="bar-fill" style={{ height: `${rate}%` }} /></div><span className="bar-label">{label}</span></div>)}
          </div>
        </article>
        <article className="panel today-panel">
          <div className="panel-heading"><div><h2>Today’s attendance</h2><p className="muted">{today}</p></div><Icon name="clock" className="today-mark" /></div>
          <div className="today-progress"><span className="today-present" style={{ width: `${todays.length ? Math.round((present / todays.length) * 100) : 0}%` }} /></div>
          <div className="today-list"><div><span className="legend-dot present" /> Present <strong>{present}</strong></div><div><span className="legend-dot absent" /> Absent <strong>{absent}</strong></div><div><span className="legend-dot late" /> Late <strong>{late}</strong></div><div><span className="legend-dot excused" /> Excused <strong>{todays.filter((record) => record.status === "Excused").length}</strong></div></div>
          {!todays.length && <p className="muted empty-hint">No attendance has been recorded today yet.</p>}
        </article>
      </section>
    </main>
  );
}
